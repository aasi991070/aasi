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
