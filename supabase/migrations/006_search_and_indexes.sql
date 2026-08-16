-- 006_search_and_indexes.sql — catalogue indexes and Postgres FTS
--
-- Written by prompt 17. Idempotent; safe to re-run in the SQL Editor.
-- Prompts 18a/18b may append category-filter indexes to this file.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists products_slug_idx on products (slug);
create index if not exists products_category_active_idx on products (category_id, is_active);
create index if not exists products_featured_active_idx on products (is_featured) where is_active;
create index if not exists products_created_at_idx on products (created_at desc);
create index if not exists products_sizes_gin on products using gin (sizes);
create index if not exists products_colors_gin on products using gin (colors);
create index if not exists products_tags_gin on products using gin (tags);
create index if not exists categories_parent_idx on categories (parent_id);
create index if not exists categories_slug_idx on categories (slug);

-- ---------------------------------------------------------------------------
-- Product full-text search vector
-- ---------------------------------------------------------------------------

create or replace function product_search_vector(
  name text,
  slug text,
  tags text[],
  description text,
  gender text
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
create index if not exists products_name_trgm on products using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Search RPCs — websearch_to_tsquery parses user input safely
-- ---------------------------------------------------------------------------

create or replace function search_products(q text, lim int default 40)
returns setof products
language sql stable security definer set search_path = public as $$
  select p.* from products p
  where p.is_active
    and (
      p.search_vector @@ websearch_to_tsquery('simple', q)
      or p.name % q
    )
  order by ts_rank_cd(p.search_vector, websearch_to_tsquery('simple', q)) desc,
           similarity(p.name, q) desc,
           p.created_at desc
  limit lim;
$$;

create or replace function category_search_vector(
  name text,
  slug text,
  description text
) returns tsvector
language sql immutable parallel safe as $$
  select setweight(to_tsvector('simple', coalesce(name, '')), 'A')
      || setweight(to_tsvector('simple', coalesce(slug, '')), 'B')
      || setweight(to_tsvector('simple', coalesce(description, '')), 'C');
$$;

create or replace function search_categories(q text, lim int default 20)
returns setof categories
language sql stable security definer set search_path = public as $$
  select c.* from categories c
  where c.is_active
    and (
      category_search_vector(c.name, c.slug, c.description)
        @@ websearch_to_tsquery('simple', q)
      or c.name % q
    )
  order by ts_rank_cd(
             category_search_vector(c.name, c.slug, c.description),
             websearch_to_tsquery('simple', q)
           ) desc,
           similarity(c.name, q) desc,
           c.sort_order asc
  limit lim;
$$;

create index if not exists categories_name_trgm on categories using gin (name gin_trgm_ops);

grant execute on function search_products(text, int) to anon, authenticated;
grant execute on function search_categories(text, int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Prompt 18a — effective price for sort/filter; normalise colour casing
-- ---------------------------------------------------------------------------

alter table products add column if not exists effective_price numeric(10,2)
  generated always as (coalesce(sale_price, price)) stored;

create index if not exists products_effective_price_idx on products (effective_price);

update products set colors = (
  select coalesce(array_agg(lower(c)), '{}') from unnest(colors) c
) where colors is not null;
