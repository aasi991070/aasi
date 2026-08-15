# 22b — Commerce schema: payments, inventory, coupons, shipping

**Scope:** migration `008_commerce_support.sql`, `types/index.ts`.

**Prerequisite:** 22a.

## Task

### Tables

```
payments        id uuid pk, order_id fk on delete cascade,
                provider text not null default 'razorpay',
                provider_order_id text,
                provider_payment_id text unique,       -- idempotency key
                provider_signature text,
                amount numeric(10,2) not null,
                status text check (status in ('created','authorized','captured',
                                              'failed','refunded','partially_refunded')),
                raw_payload jsonb, created_at

inventory_moves id, product_id fk, variant_id fk null,
                delta int not null,
                reason text check (reason in ('order','cancel','return','manual','restock')),
                order_id fk null, note text, created_at

coupons         code citext primary key,
                type text check (type in ('percent','fixed')),
                value numeric(10,2) not null,
                min_subtotal numeric(10,2) default 0,
                starts_at timestamptz, ends_at timestamptz,
                usage_limit int null, used_count int not null default 0,
                is_active boolean not null default true

shipments       id, order_id fk, carrier text, awb text,
                status text, shipped_at, delivered_at, created_at
```

`provider_payment_id` being **unique** is the idempotency guarantee prompt 26
relies on for webhook replays. Do not make it nullable-without-unique.

### The stock function

This is the single most important object in the commerce schema. It must be
correct:

```sql
create or replace function decrement_stock(
  p_variant_id uuid, p_product_id uuid, p_qty int, p_order_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_available int;
begin
  if p_variant_id is not null then
    select stock_count into v_available
      from product_variants where id = p_variant_id for update;
  else
    select stock_count into v_available
      from products where id = p_product_id for update;
  end if;

  if v_available is null then
    raise exception 'stock row not found';
  end if;
  if v_available < p_qty then
    raise exception 'insufficient stock: % available, % requested', v_available, p_qty;
  end if;

  if p_variant_id is not null then
    update product_variants set stock_count = stock_count - p_qty where id = p_variant_id;
  else
    update products set stock_count = stock_count - p_qty where id = p_product_id;
  end if;

  insert into inventory_moves (product_id, variant_id, delta, reason, order_id)
  values (p_product_id, p_variant_id, -p_qty, 'order', p_order_id);
end;
$$;
```

`for update` is what prevents two concurrent checkouts overselling the last
unit. Do not replace it with a read-then-write.

Add the mirror `restock(...)` used by cancellations and returns, writing a
positive `delta` with the appropriate reason.

Add `redeem_coupon(code)` that increments `used_count` under a row lock and
raises if `usage_limit` is exceeded or the window has closed.

### RLS

`payments`, `inventory_moves`, `coupons`, `shipments`: **no anon or
authenticated access at all.** Service role and `is_admin()` only. Customers see
payment and shipment state through the order, never directly.

### Types

Add matching interfaces to `types/index.ts`.

## Acceptance

- `decrement_stock` raises when qty exceeds available.
- Two concurrent calls for the last unit: one succeeds, one raises. Test with
  two psql sessions and an explicit `begin`.
- Every stock change has a corresponding `inventory_moves` row.
- `select * from payments` as `anon` returns permission denied.
