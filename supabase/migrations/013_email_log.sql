-- 013_email_log.sql — transactional email log + verified review inserts
-- Prompt 27c. Prerequisite: 004, 008, 012.

create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  to_email citext not null,
  template text not null,
  status text not null check (status in ('sent', 'failed')),
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists email_log_status_created_idx
  on email_log (status, created_at desc);

create index if not exists email_log_order_template_idx
  on email_log (order_id, template);

alter table email_log enable row level security;

drop policy if exists "Admins manage email_log" on email_log;
create policy "Admins manage email_log"
  on email_log for all to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- Verified-purchase reviews (RLS-backed insert; replaces service-role path)
-- ---------------------------------------------------------------------------

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_reviews_order_id_fkey'
  ) then
    alter table product_reviews
      add constraint product_reviews_order_id_fkey
      foreign key (order_id) references orders(id) on delete set null;
  end if;
end $$;

drop policy if exists "Verified purchasers can review" on product_reviews;
create policy "Verified purchasers can review"
  on product_reviews for insert to authenticated
  with check (
    order_id is not null
    and status = 'approved'
    and exists (
      select 1 from orders o
      join order_items oi on oi.order_id = o.id
      where o.id = product_reviews.order_id
        and o.user_id = auth.uid()
        and o.status = 'delivered'
        and oi.product_id = product_reviews.product_id
    )
  );

drop policy if exists "Unverified reviews enter moderation" on product_reviews;
create policy "Unverified reviews enter moderation"
  on product_reviews for insert to anon, authenticated
  with check (
    order_id is null
    and status = 'pending'
  );
