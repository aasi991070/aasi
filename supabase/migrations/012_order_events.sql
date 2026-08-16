-- 012_order_events.sql — order audit trail + sales metrics RPC
-- Prompt 27b. Prerequisite: 008, 009.

create table if not exists order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  from_status text,
  to_status text,
  event_type text not null check (
    event_type in ('status_change', 'note', 'refund', 'shipment')
  ),
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_id_created_at_idx
  on order_events (order_id, created_at desc);

alter table order_events enable row level security;

drop policy if exists "Admins manage order_events" on order_events;
create policy "Admins manage order_events"
  on order_events for all to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- Sales metrics (single round trip for admin dashboard)
-- ---------------------------------------------------------------------------

create or replace function get_sales_metrics(p_low_stock_threshold int default 5)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'revenue', jsonb_build_object(
      'today', coalesce((
        select sum(total) from orders
        where payment_status = 'paid'
          and placed_at >= date_trunc('day', now())
      ), 0),
      'last_7d', coalesce((
        select sum(total) from orders
        where payment_status = 'paid'
          and placed_at >= now() - interval '7 days'
      ), 0),
      'last_30d', coalesce((
        select sum(total) from orders
        where payment_status = 'paid'
          and placed_at >= now() - interval '30 days'
      ), 0)
    ),
    'orders', jsonb_build_object(
      'today', coalesce((
        select count(*) from orders
        where payment_status = 'paid'
          and placed_at >= date_trunc('day', now())
      ), 0),
      'last_7d', coalesce((
        select count(*) from orders
        where payment_status = 'paid'
          and placed_at >= now() - interval '7 days'
      ), 0),
      'last_30d', coalesce((
        select count(*) from orders
        where payment_status = 'paid'
          and placed_at >= now() - interval '30 days'
      ), 0)
    ),
    'aov', jsonb_build_object(
      'today', coalesce((
        select avg(total) from orders
        where payment_status = 'paid'
          and placed_at >= date_trunc('day', now())
      ), 0),
      'last_7d', coalesce((
        select avg(total) from orders
        where payment_status = 'paid'
          and placed_at >= now() - interval '7 days'
      ), 0),
      'last_30d', coalesce((
        select avg(total) from orders
        where payment_status = 'paid'
          and placed_at >= now() - interval '30 days'
      ), 0)
    ),
    'top_by_units', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select
          oi.name_snapshot as name,
          oi.product_id,
          sum(oi.qty)::int as units,
          sum(oi.line_total)::numeric(12,2) as revenue
        from order_items oi
        join orders o on o.id = oi.order_id
        where o.payment_status = 'paid'
          and o.placed_at >= now() - interval '30 days'
        group by oi.name_snapshot, oi.product_id
        order by units desc
        limit 5
      ) t
    ), '[]'::jsonb),
    'top_by_revenue', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select
          oi.name_snapshot as name,
          oi.product_id,
          sum(oi.qty)::int as units,
          sum(oi.line_total)::numeric(12,2) as revenue
        from order_items oi
        join orders o on o.id = oi.order_id
        where o.payment_status = 'paid'
          and o.placed_at >= now() - interval '30 days'
        group by oi.name_snapshot, oi.product_id
        order by revenue desc
        limit 5
      ) t
    ), '[]'::jsonb),
    'low_stock_variants', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select
          pv.id as variant_id,
          p.id as product_id,
          p.name as product_name,
          pv.size,
          pv.color,
          pv.stock_count
        from product_variants pv
        join products p on p.id = pv.product_id
        where pv.is_enabled = true
          and pv.stock_count <= p_low_stock_threshold
        order by pv.stock_count asc, p.name asc
        limit 10
      ) t
    ), '[]'::jsonb),
    'pending_reviews', coalesce((
      select count(*) from product_reviews where status = 'pending'
    ), 0),
    'catalog', jsonb_build_object(
      'total_products', (select count(*) from products),
      'active_products', (select count(*) from products where is_active = true),
      'out_of_stock', (select count(*) from products where stock_count <= 0),
      'total_categories', (select count(*) from categories)
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function get_sales_metrics(int) from public;
grant execute on function get_sales_metrics(int) to authenticated;
