# 18b — Filter facets and UI

**Scope:** migration addition, `lib/queries/products.ts`,
`components/storefront/CategoryFilter.tsx`, new `FilteredProductGrid.tsx`,
`SortSelect.tsx`, `ActiveFilterChips.tsx`.

**Prerequisite:** 18a.

## Context

`app/(storefront)/category/[...slug]/page.tsx:88-90` derives the available
colours from the products it just fetched:

```ts
const availableColors = Array.from(new Set(products.flatMap((p) => p.colors))).sort();
```

Once 18a paginates, that list becomes "colours on the current page" — it would
shrink as you page and change as you filter. Facets must come from a separate
query over the whole category.

`CategoryFilter` also shows a hardcoded size list from `constants/index.ts:32`
regardless of what the category actually stocks, and has no result counts and no
price range control (just two number inputs, lines 92-105).

## Task

### Facets RPC

Distinct-unnest plus min/max is not expressible as a single PostgREST select.
Add to the migration:

```sql
create or replace function category_facets(category_ids uuid[])
returns table (sizes text[], colors text[], min_price numeric, max_price numeric)
language sql stable as $$
  select
    (select coalesce(array_agg(distinct s order by s), '{}')
       from products p, unnest(p.sizes) s
      where p.category_id = any(category_ids) and p.is_active),
    (select coalesce(array_agg(distinct c order by c), '{}')
       from products p, unnest(p.colors) c
      where p.category_id = any(category_ids) and p.is_active),
    (select min(effective_price) from products
      where category_id = any(category_ids) and is_active),
    (select max(effective_price) from products
      where category_id = any(category_ids) and is_active);
$$;
```

Add `getCategoryFacets(categoryIds)` in the query layer calling it via
`supabase.rpc`, cached with the `products` tag.

Optionally add per-option counts with a second RPC returning
`(value, count)` per facet — show them next to each option if cheap, skip if not.

### `FilteredProductGrid`

Prompt 15 made the category page static and moved filtering to the client. Build
that component here:

- Reads `useSearchParams` for `sizes`, `colors`, `minPrice`, `maxPrice`,
  `inStock`, `sort`, `page`.
- Seeded with the server-rendered first page so there is **no empty flash** and
  the unfiltered view needs zero client fetches.
- On param change, calls a `getFilteredProducts` server action and renders the
  result. Debounce price input by 300ms.
- Shows a skeleton grid while pending, using the existing `Skeleton` primitive.
- Announces "24 products match" through the `LiveRegion` from prompt 13.

### `CategoryFilter`

- Take `facets` as a prop instead of `availableColors`. Show only the sizes and
  colours the category actually stocks.
- Replace the two bare number inputs with a dual-handle price range slider
  bound to `facets.min_price` / `facets.max_price`, with numeric inputs beside
  it for accessibility. Keep both keyboard-operable.
- `aria-pressed` on every pill, `aria-label` on the price inputs, a
  visually-hidden `SheetTitle` on the mobile sheet (prompt 13 lists these —
  implement them here if 13 has not run yet).
- Storefront tokens; the current `border-v18-primary bg-v18-primary` active
  state (lines 52, 76, 116) becomes accent.

### `SortSelect` and `ActiveFilterChips`

- Sort `<select>` above the grid, wired to the `sort` param, options matching
  18a's four values.
- Active filters as removable chips above the grid, with a "Clear all" that
  keeps `sort` (the existing `Clear all` at line 125 links to `?`, which wipes
  sort too).

## Acceptance

- Filter option lists do not change as you page.
- A category stocking only S/M/L does not offer XXL.
- The unfiltered category page performs zero client-side fetches.
- Result count changes are announced to screen readers.
- Clearing filters preserves the chosen sort.
