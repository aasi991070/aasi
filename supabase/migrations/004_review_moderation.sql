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
