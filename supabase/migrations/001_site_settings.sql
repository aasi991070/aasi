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
