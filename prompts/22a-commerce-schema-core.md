# 22a — Commerce schema: carts, orders, addresses

**Scope:** migration `007_commerce_core.sql`, `types/index.ts`, and the small
application changes the stock fix forces.

## Context

There is no cart, order, address, or payment table anywhere. A repo-wide grep
for `cart|checkout|order|payment|wishlist` returns only the literal label
"Add to Cart", `sort_order`, and `.order()` query calls.

Also: **`products.in_stock` (boolean) and `products.stock_count` (integer) are
independent columns that can contradict each other** — a product can be
`in_stock: true` with `stock_count: 0`. Fix that here, before anything depends
on it.

## Task

### 1. Fix the stock contradiction

Postgres has no `ALTER COLUMN … SET GENERATED ALWAYS AS (…) STORED`, so:

```sql
-- backfill first, while the boolean still carries information
update products set stock_count = 1
  where in_stock = true and coalesce(stock_count, 0) = 0;   -- review these rows manually
update products set stock_count = 0 where in_stock = false;

alter table products drop column in_stock;
alter table products add column in_stock boolean
  generated always as (stock_count > 0) stored;

alter table product_variants alter column stock_count set default 0;
alter table product_variants alter column stock_count set not null;
```

Log the ids touched by the first `update` in a comment — they need a real stock
count from Arif.

**A generated column rejects any INSERT or UPDATE that names it**, so this
migration *does* require application changes despite otherwise being schema-only:

- Remove `in_stock` from `ProductFormData` (`types/index.ts:120`) — keep it on
  `Product`, which is read-only.
- Remove it from the zod schema and the "In stock" checkbox in
  `ProductForm.tsx` (line 263). Stock is now expressed solely by `stock_count`.
- `createProduct` / `updateProduct` (`products.ts:337, 356`) spread the form
  payload — confirm nothing sends `in_stock` after the type change.

### 2. Tables

```
carts       id uuid pk, user_id uuid null, session_id text not null,
            status text check (status in ('active','converted','abandoned')) default 'active',
            currency text default 'INR', created_at, updated_at, expires_at

  create unique index carts_active_session_idx on carts (session_id)
    where status = 'active';
  -- partial uniqueness must be an index; `unique (…) where …` is not valid
  -- as a table constraint

cart_items  id, cart_id fk on delete cascade, product_id fk, variant_id fk null,
            qty int not null check (qty > 0),
            unit_price_snapshot numeric(10,2) not null,
            unique (cart_id, product_id, variant_id)

addresses   id, user_id uuid null, name, line1, line2, city, state,
            pincode text check (pincode ~ '^[1-9][0-9]{5}$'),
            country text default 'IN', phone text,
            type text check (type in ('shipping','billing'))

orders      id, order_number text unique not null, user_id null, email citext not null,
            phone text,
            status text check (status in ('pending','confirmed','packed','shipped',
                                          'delivered','cancelled','returned')) default 'pending',
            payment_status text check (payment_status in ('unpaid','paid','failed',
                                          'refunded','partially_refunded')) default 'unpaid',
            subtotal, discount, shipping_fee, tax, total numeric(10,2) not null,
            currency text default 'INR', coupon_code text null,
            shipping_address jsonb not null, billing_address jsonb,
            notes text, placed_at timestamptz, created_at, updated_at

order_items id, order_id fk on delete cascade,
            product_id fk on delete set null, variant_id fk on delete set null,
            name_snapshot, slug_snapshot, sku_snapshot, image_snapshot text,
            size text, color text, qty int, unit_price numeric(10,2),
            tax_rate numeric(5,2), line_total numeric(10,2)
```

### 3. Non-negotiables

- `order_items` **snapshots** name, slug, SKU, image, and price. Orders must not
  change when the catalogue changes — hence `on delete set null` on the product
  FK rather than cascade.
- `order_number` is human-readable, from a sequence-backed function:
  `AAS-2026-00042`. Never expose the UUID to customers.
- All money is `numeric(10,2)`. Never float, never integer rupees.
- RLS on every table. Carts: readable/writable where `session_id` matches the
  request's cart claim, or `user_id = auth.uid()`. Orders: readable by
  `user_id`, writable by service role and `is_admin()` only.

### 4. Types

Add matching interfaces to `types/index.ts`. No inline types anywhere, per the
project's modularity rules.

## Acceptance

- Migration runs clean on a fresh database and is idempotent on the existing one.
- `in_stock` can no longer disagree with `stock_count`.
- Saving a product in the admin still works after the `in_stock` removal.
- `npm run typecheck` clean.
