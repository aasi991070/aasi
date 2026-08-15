# 17 — Database indexes and real full-text search

**Scope:** migration `006_search_and_indexes.sql`, `lib/queries/search.ts`,
`lib/queries/products.ts`.

## Context

**The catalogue tables have no indexes in the repo.** (`002_product_reviews.sql:12`
creates one on `product_reviews`; that is the only one.) Every storefront query
filters or sorts on unindexed columns: `products.slug` on every PDP,
`products.category_id + is_active` on every category page,
`products.is_featured + is_active` on the home page, `products.created_at desc`
everywhere, `categories.parent_id`, `categories.slug`.

**Search is `ilike` over concatenated OR filters** (`search.ts:44-53`), capped
at 100 rows, then **re-filtered in Node** (lines 61-65) because the SQL-level OR
is too loose. It cannot rank and it cannot match across fields.

## Task

Migration `supabase/migrations/006_search_and_indexes.sql`.

### Indexes

```sql
create index if not exists products_slug_idx on products (slug);
create index if not exists products_category_active_idx on products (category_id, is_active);
create index if not exists products_featured_active_idx on products (is_featured) where is_active;
create index if not exists products_created_at_idx on products (created_at desc);
create index if not exists products_sizes_gin  on products using gin (sizes);
create index if not exists products_colors_gin on products using gin (colors);
create index if not exists products_tags_gin   on products using gin (tags);
create index if not exists categories_parent_idx on categories (parent_id);
create index if not exists categories_slug_idx   on categories (slug);
```

### Search vector — use an immutable helper

A `generated always as (…) stored` column requires an **immutable** expression.
`array_to_string()` is only STABLE, so the obvious formulation fails with
`ERROR: generation expression is not immutable`. Wrap it:

```sql
create or replace function product_search_vector(
  name text, slug text, tags text[], description text, gender text
) returns tsvector
language sql immutable parallel safe as $$
  select setweight(to_tsvector('simple', coalesce(name, '')), 'A')
      || setweight(to_tsvector('simple', coalesce(slug, '')), 'B')
      || setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '), '')), 'B')
      || setweight(to_tsvector('simple', coalesce(description, '')), 'C')
      || setweight(to_tsvector('simple', coalesce(gender, '')), 'D');
$$;

alter table products add column if not exists search_vector tsvector
  generated always as (
    product_search_vector(name, slug, tags, description, gender)
  ) stored;

create index if not exists products_search_idx on products using gin (search_vector);
```

Marking a SQL function `immutable` when its body calls a STABLE builtin is safe
here because `array_to_string` is only STABLE for `NULL`-separator locale
reasons that do not apply to a literal space separator. If Postgres still
rejects the generated column, fall back to a `before insert or update` trigger
that maintains the column — functionally identical, one more moving part.

### Search functions

```sql
create or replace function search_products(q text, lim int default 40)
returns setof products
language sql stable security definer set search_path = public as $$
  select p.* from products p
  where p.is_active
    and (
      p.search_vector @@ websearch_to_tsquery('simple', q)
      or p.name % q                                    -- pg_trgm fallback
    )
  order by ts_rank_cd(p.search_vector, websearch_to_tsquery('simple', q)) desc,
           similarity(p.name, q) desc,
           p.created_at desc
  limit lim;
$$;
```

Enable `pg_trgm` and add `create index products_name_trgm on products using gin (name gin_trgm_ops)`.
Add an equivalent `search_categories(q text)`.

`websearch_to_tsquery` parses arbitrary user input safely — this removes the
injection surface entirely, which is the real reason to do it.

### Application

- `lib/queries/search.ts` — replace both functions with `supabase.rpc(...)`.
  **Delete** the Node-side `matchesAllTokens` post-filtering. Keep
  `getMatchedFields` for result-card highlighting.
- `lib/queries/products.ts` — `getProducts` admin search uses the same RPC.
- **Do not delete `buildIlikeOrFilter` yet.** `hooks/useProducts.ts:29` still
  calls it and that hook is only removed in prompt 19. Leave a `// TODO(19)`.

## Why `'simple'` and not `'english'`

The catalogue mixes English product names with transliterated Indian garment
terms (kurta, dupatta, sherwani) that the English stemmer mangles. Revisit only
if it under-matches on English descriptions.

## Acceptance

- `explain analyze` on a category page query shows an index scan, not a seq scan.
- "blue linen shirt" returns relevance-ranked results.
- "shrit" (typo) still returns "shirt" products via the trigram fallback.
- `a,is_active.eq.false` returns normal results with no error.
