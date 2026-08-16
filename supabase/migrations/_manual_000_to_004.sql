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
-- Run this in the Supabase SQL Editor to enable the monochrome toggle.
-- Creates a singleton settings row readable by everyone. Writes are gated on
-- is_admin() in 003_admin_rls.sql — that helper does not exist yet at this
-- point in the run order, so this file only drops the old, over-broad
-- auth.role() = 'authenticated' write policies.

create table if not exists site_settings (
  id int primary key default 1 check (id = 1),
  monochrome_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into site_settings (id)
values (1)
on conflict (id) do nothing;

alter table site_settings enable row level security;

drop policy if exists "Public read" on site_settings;
drop policy if exists "Authenticated update" on site_settings;
drop policy if exists "Authenticated insert" on site_settings;
drop policy if exists "Authenticated write" on site_settings;

-- Public read is intentional and load-bearing: the storefront reads settings
-- anonymously so the root layout can stay static (prompt 15).
create policy "Public read"
  on site_settings
  for select
  using (true);

-- Insert/update policies are created in 003_admin_rls.sql. Until that file has
-- run, site_settings is read-only through the API, which is the safe default.
-- Run in Supabase SQL Editor for product reviews.

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_product_id_idx
  on product_reviews(product_id);

alter table product_reviews enable row level security;

drop policy if exists "Public read reviews" on product_reviews;
create policy "Public read reviews"
  on product_reviews
  for select
  using (true);
-- 003_admin_rls.sql — single source of truth for catalogue authorisation
--
-- Before this migration, catalogue writes were authorised by RLS policies that
-- were never in the repo. If any of them granted writes to `authenticated`,
-- anyone who could sign up could edit or delete the catalogue.
--
-- After this migration:
--   * anon + authenticated may SELECT active rows only
--   * every INSERT/UPDATE/DELETE requires membership of `admin_users`
--
-- Idempotent: safe to re-run against the live project.
--
-- !! MANUAL FOLLOW-UP REQUIRED !!  Until at least one row exists in
-- `admin_users`, every catalogue write will be denied — including the admin UI.
-- See supabase/migrations/README.md.

-- ---------------------------------------------------------------------------
-- 1. Admin registry
-- ---------------------------------------------------------------------------

create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. is_admin() helper
--
-- security definer so it can read admin_users regardless of that table's own
-- RLS. This is what stops the policies below from recursing.
-- ---------------------------------------------------------------------------

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to anon, authenticated;

-- admin_users is readable only by admins; it is never writable through the
-- API. Add members with the service role or from the SQL Editor.
alter table admin_users enable row level security;

drop policy if exists "Admins read admin_users" on admin_users;
create policy "Admins read admin_users"
  on admin_users
  for select
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- 3. categories
-- ---------------------------------------------------------------------------

alter table categories enable row level security;

-- Legacy names, plus every name this file creates, so re-running is clean.
drop policy if exists "Public read categories" on categories;
drop policy if exists "Public read active categories" on categories;
drop policy if exists "Admins read all categories" on categories;
drop policy if exists "Admins write categories" on categories;
drop policy if exists "Admins insert categories" on categories;
drop policy if exists "Admins update categories" on categories;
drop policy if exists "Admins delete categories" on categories;
drop policy if exists "Authenticated write categories" on categories;
drop policy if exists "Enable read access for all users" on categories;
drop policy if exists "Enable insert for authenticated users only" on categories;
drop policy if exists "Enable update for authenticated users only" on categories;
drop policy if exists "Enable delete for authenticated users only" on categories;

create policy "Public read active categories"
  on categories
  for select
  to anon, authenticated
  using (is_active);

create policy "Admins read all categories"
  on categories
  for select
  to authenticated
  using (is_admin());

create policy "Admins insert categories"
  on categories
  for insert
  to authenticated
  with check (is_admin());

create policy "Admins update categories"
  on categories
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admins delete categories"
  on categories
  for delete
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- 4. products
-- ---------------------------------------------------------------------------

alter table products enable row level security;

drop policy if exists "Public read products" on products;
drop policy if exists "Public read active products" on products;
drop policy if exists "Admins read all products" on products;
drop policy if exists "Admins write products" on products;
drop policy if exists "Admins insert products" on products;
drop policy if exists "Admins update products" on products;
drop policy if exists "Admins delete products" on products;
drop policy if exists "Authenticated write products" on products;
drop policy if exists "Enable read access for all users" on products;
drop policy if exists "Enable insert for authenticated users only" on products;
drop policy if exists "Enable update for authenticated users only" on products;
drop policy if exists "Enable delete for authenticated users only" on products;

create policy "Public read active products"
  on products
  for select
  to anon, authenticated
  using (is_active);

create policy "Admins read all products"
  on products
  for select
  to authenticated
  using (is_admin());

create policy "Admins insert products"
  on products
  for insert
  to authenticated
  with check (is_admin());

create policy "Admins update products"
  on products
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admins delete products"
  on products
  for delete
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- 5. product_variants — visibility follows the parent product
-- ---------------------------------------------------------------------------

alter table product_variants enable row level security;

drop policy if exists "Public read variants" on product_variants;
drop policy if exists "Public read variants of active products" on product_variants;
drop policy if exists "Admins read all variants" on product_variants;
drop policy if exists "Admins write variants" on product_variants;
drop policy if exists "Admins insert variants" on product_variants;
drop policy if exists "Admins update variants" on product_variants;
drop policy if exists "Admins delete variants" on product_variants;
drop policy if exists "Authenticated write variants" on product_variants;
drop policy if exists "Enable read access for all users" on product_variants;
drop policy if exists "Enable insert for authenticated users only" on product_variants;
drop policy if exists "Enable update for authenticated users only" on product_variants;
drop policy if exists "Enable delete for authenticated users only" on product_variants;

create policy "Public read variants of active products"
  on product_variants
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = product_variants.product_id
        and p.is_active
    )
  );

create policy "Admins read all variants"
  on product_variants
  for select
  to authenticated
  using (is_admin());

create policy "Admins insert variants"
  on product_variants
  for insert
  to authenticated
  with check (is_admin());

create policy "Admins update variants"
  on product_variants
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admins delete variants"
  on product_variants
  for delete
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- 6. site_settings — public SELECT stays open (prompt 15 reads it anonymously);
--    only writes are gated. 001_site_settings.sql drops the old
--    auth.role() = 'authenticated' policies; they are recreated here because
--    is_admin() does not exist yet at the point 001 runs.
-- ---------------------------------------------------------------------------

alter table site_settings enable row level security;

drop policy if exists "Authenticated insert" on site_settings;
drop policy if exists "Authenticated update" on site_settings;
drop policy if exists "Authenticated write" on site_settings;
drop policy if exists "Admins insert site_settings" on site_settings;
drop policy if exists "Admins update site_settings" on site_settings;

create policy "Admins insert site_settings"
  on site_settings
  for insert
  to authenticated
  with check (is_admin());

create policy "Admins update site_settings"
  on site_settings
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- 7. Storage: product-images bucket
--
-- Policies live on storage.objects, which is shared by every bucket, so the
-- drop below is scoped to policies that actually mention this bucket. Dropping
-- all policies on storage.objects would take out other buckets (site-config).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%product-images%'
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "Public read product-images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "Admins upload product-images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and is_admin());

create policy "Admins update product-images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

create policy "Admins delete product-images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and is_admin());
-- 004_review_moderation.sql — moderation queue and abuse controls for reviews
--
-- POST /api/reviews had no auth, no rate limit and no moderation, and inserted
-- with the service role, bypassing RLS. Reviews went straight onto the
-- storefront. This migration makes 'pending' the default state and hides
-- anything not approved from the public.
--
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Moderation columns
--
-- The column is added with default 'approved' and the default is then changed
-- to 'pending'. That backfills pre-existing reviews in one step, and — unlike
-- `update ... where status = 'pending'` — re-running this file will NOT
-- silently approve the current moderation queue.
-- ---------------------------------------------------------------------------

alter table product_reviews add column if not exists status text not null default 'approved';
alter table product_reviews alter column status set default 'pending';

alter table product_reviews add column if not exists order_id uuid;
alter table product_reviews add column if not exists ip_hash text;
alter table product_reviews add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_reviews_status_check'
  ) then
    alter table product_reviews
      add constraint product_reviews_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists product_reviews_product_status_created_idx
  on product_reviews (product_id, status, created_at desc);

drop trigger if exists product_reviews_set_updated_at on product_reviews;
create trigger product_reviews_set_updated_at
  before update on product_reviews
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Only approved reviews are public
-- ---------------------------------------------------------------------------

alter table product_reviews enable row level security;

drop policy if exists "Public read reviews" on product_reviews;
drop policy if exists "Public read approved reviews" on product_reviews;
drop policy if exists "Admins read all reviews" on product_reviews;
drop policy if exists "Admins update reviews" on product_reviews;
drop policy if exists "Admins delete reviews" on product_reviews;

create policy "Public read approved reviews"
  on product_reviews
  for select
  to anon, authenticated
  using (status = 'approved');

create policy "Admins read all reviews"
  on product_reviews
  for select
  to authenticated
  using (is_admin());

create policy "Admins update reviews"
  on product_reviews
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admins delete reviews"
  on product_reviews
  for delete
  to authenticated
  using (is_admin());

-- No insert policy: submissions go through the API with the service role,
-- which bypasses RLS. Prompt 27c replaces that with an RLS-backed insert
-- scoped to a verified purchase.

-- ---------------------------------------------------------------------------
-- 3. Rate limiting
-- ---------------------------------------------------------------------------

create table if not exists review_rate_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (ip_hash, window_start)
);

alter table review_rate_limits enable row level security;

-- Deliberately no policies. Only the service role touches this table, and the
-- service role bypasses RLS. anon/authenticated therefore get nothing.

-- Check and increment in one statement so two concurrent submissions from the
-- same IP cannot both read a stale count and both pass. Returns true when the
-- request is within the limit.
create or replace function check_review_rate_limit(p_ip_hash text, p_limit int default 3)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_window timestamptz := date_trunc('hour', now());
  v_count int;
begin
  delete from review_rate_limits where window_start < now() - interval '1 day';

  insert into review_rate_limits (ip_hash, window_start, count)
  values (p_ip_hash, v_window, 1)
  on conflict (ip_hash, window_start)
  do update set count = review_rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Callable only by the service role; never expose the limiter to the browser.
revoke all on function check_review_rate_limit(text, int) from public, anon, authenticated;
