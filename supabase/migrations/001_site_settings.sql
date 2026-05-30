-- Run this in the Supabase SQL Editor to enable the monochrome toggle.
-- Creates a singleton settings row readable by everyone, updatable by authenticated users.

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

create policy "Public read"
  on site_settings
  for select
  using (true);

create policy "Authenticated insert"
  on site_settings
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated update"
  on site_settings
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
