-- 005_site_content.sql — newsletter subscribers, contact messages, generic rate limits
--
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. citext for case-insensitive email storage
-- ---------------------------------------------------------------------------

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- 2. Site content tables
-- ---------------------------------------------------------------------------

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;
alter table contact_messages enable row level security;

drop policy if exists "Anon insert newsletter subscribers" on newsletter_subscribers;
drop policy if exists "Admins read newsletter subscribers" on newsletter_subscribers;
drop policy if exists "Anon insert contact messages" on contact_messages;
drop policy if exists "Admins read contact messages" on contact_messages;

create policy "Anon insert newsletter subscribers"
  on newsletter_subscribers
  for insert
  to anon
  with check (true);

create policy "Admins read newsletter subscribers"
  on newsletter_subscribers
  for select
  to authenticated
  using (is_admin());

create policy "Anon insert contact messages"
  on contact_messages
  for insert
  to anon
  with check (true);

create policy "Admins read contact messages"
  on contact_messages
  for select
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- 3. Generalise review_rate_limits → rate_limits (bucketed)
-- ---------------------------------------------------------------------------

create table if not exists rate_limits (
  bucket text not null,
  ip_hash text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (bucket, ip_hash, window_start)
);

alter table rate_limits enable row level security;

do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'review_rate_limits'
  ) then
    insert into rate_limits (bucket, ip_hash, window_start, count)
    select 'review', ip_hash, window_start, count
    from review_rate_limits
    on conflict (bucket, ip_hash, window_start) do nothing;

    drop table review_rate_limits;
  end if;
end $$;

-- Generic limiter: one statement to check and increment atomically.
create or replace function check_rate_limit(
  p_bucket text,
  p_ip_hash text,
  p_limit int default 3
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz := date_trunc('hour', now());
  v_count int;
begin
  delete from rate_limits
  where window_start < now() - interval '1 day';

  insert into rate_limits (bucket, ip_hash, window_start, count)
  values (p_bucket, p_ip_hash, v_window, 1)
  on conflict (bucket, ip_hash, window_start)
  do update set count = rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Backward-compatible wrapper for prompt 02 callers until application code migrates.
create or replace function check_review_rate_limit(p_ip_hash text, p_limit int default 3)
returns boolean
language sql
security definer
set search_path = public
as $$
  select check_rate_limit('review', p_ip_hash, p_limit);
$$;

revoke all on function check_rate_limit(text, text, int) from public, anon, authenticated;
revoke all on function check_review_rate_limit(text, int) from public, anon, authenticated;
