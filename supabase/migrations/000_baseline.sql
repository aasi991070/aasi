-- 000_baseline.sql — catalogue schema baseline
--
-- Brings the `categories`, `products` and `product_variants` tables under
-- version control. These already exist in the live Supabase project; this file
-- is written to be a no-op there and to reproduce the schema from scratch on a
-- fresh Postgres.
--
-- RLS for these tables is NOT defined here. It is owned by 003_admin_rls.sql so
-- that every policy lives in one reviewable place.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- categories — self-referencing 4-level tree
--   level 1 = gender, 2 = division, 3 = type, 4 = subtype
-- ---------------------------------------------------------------------------

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references categories(id) on delete set null,
  level smallint not null default 1 check (level between 1 and 4),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_parent_id_idx on categories(parent_id);
create index if not exists categories_active_sort_idx on categories(is_active, sort_order);
create index if not exists categories_level_idx on categories(level);

drop trigger if exists categories_set_updated_at on categories;
create trigger categories_set_updated_at
  before update on categories
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  sale_price numeric(10,2) check (sale_price >= 0),
  category_id uuid references categories(id) on delete set null,
  gender text check (gender in ('men', 'women', 'unisex')),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  images text[] not null default '{}',
  thumbnail_url text,
  in_stock boolean not null default true,
  stock_count integer not null default 0 check (stock_count >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on products(category_id);
create index if not exists products_is_active_idx on products(is_active);
create index if not exists products_is_featured_idx on products(is_featured);
create index if not exists products_gender_idx on products(gender);
create index if not exists products_created_at_idx on products(created_at desc);

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text,
  color text,
  stock_count integer not null default 0 check (stock_count >= 0),
  sku text unique,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on product_variants(product_id);
