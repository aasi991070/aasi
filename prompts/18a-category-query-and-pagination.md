# 18a — Push category filtering into Postgres and paginate

**Scope:** `lib/queries/products.ts`, one migration addition,
`app/(storefront)/category/[...slug]/page.tsx`, `ProductGrid.tsx`.

Filter UI and facets are prompt 18b.

## Context

`getProductsByCategory` (`lib/queries/products.ts:186-239`) has **no `.limit()`
and no `.range()`** — unlike `getProducts` (lines 51-58), which paginates
correctly. It loads every active product in the category and all descendants,
then filters **in JavaScript**: sizes (lines 214-218), colours (219-225),
search (227-233).

At 500 products in a category that is 500 rows over the wire per page view, and
`page.tsx:115` renders the entire result set with no pagination UI.

Order is hardcoded to `created_at desc` — there is no sort control.

## Task

### Migration addition (append to `006_search_and_indexes.sql`)

Sorting by "the price the customer pays" is not expressible through PostgREST —
`.order()` takes a column, not an expression, so `coalesce(sale_price, price)`
cannot be used directly. Add a generated column:

```sql
alter table products add column if not exists effective_price numeric(10,2)
  generated always as (coalesce(sale_price, price)) stored;
create index if not exists products_effective_price_idx on products (effective_price);
```

Also normalise colour casing **on write** rather than lowering at query time
(which would defeat the GIN index):

```sql
update products set colors = (
  select coalesce(array_agg(lower(c)), '{}') from unnest(colors) c
) where colors is not null;
```

Prompt 23 makes `ProductForm` lowercase colours on save so this stays true.

### Query layer

Rewrite `getProductsByCategory` to accept `{ page, pageSize, sort }` and push
everything into SQL:

```ts
if (filters.sizes?.length)  query = query.overlaps("sizes", filters.sizes);
if (filters.colors?.length) query = query.overlaps("colors", filters.colors.map(c => c.toLowerCase()));
if (filters.minPrice != null) query = query.gte("effective_price", filters.minPrice);
if (filters.maxPrice != null) query = query.lte("effective_price", filters.maxPrice);
```

`overlaps` maps to the `&&` array operator and uses the GIN indexes from prompt 17.
Note the existing min/max filters (lines 202-207) currently compare against
`price`, ignoring sale prices — `effective_price` fixes that too.

Search delegates to the `search_products` RPC from prompt 17, intersected with
the category filter.

Add `.range(from, to)` and `{ count: "exact" }`. Return
`{ products, total, page, pageSize }`.

Sort options: `newest` (default, `created_at desc`), `price_asc` /
`price_desc` (`effective_price`), `name_asc`.

### Page and grid

- The page renders the **unfiltered first page** statically (prompt 15 removed
  `searchParams` from it). Pagination links carry `?page=N` and are real
  `<Link href>` so they stay crawlable — not a "Load more" button.
- Show "Showing 1–20 of 137".
- `PRODUCTS_PAGE_SIZE` is already `20` in `constants/index.ts:49`.
- `ProductGrid` gains an optional `priority` count so the first row sets
  `priority` on its images.

## Acceptance

- A category with 500 products transfers ≤20 rows per request.
- Size and colour filters produce SQL-level filters — check the Supabase logs;
  no post-fetch JS filtering remains in `getProductsByCategory`.
- Sorting by price ranks a ₹500 sale item above a ₹900 full-price item.
- Page 2 is reachable by a crawlable `<a href>`.
