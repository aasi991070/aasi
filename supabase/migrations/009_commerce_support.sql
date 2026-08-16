-- 009_commerce_support.sql — payments, inventory, coupons, shipments
-- Prompt 22b. Prerequisite: 008_commerce_core.sql.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text unique,
  provider_signature text,
  amount numeric(10, 2) not null,
  status text not null
    check (status in (
      'created', 'authorized', 'captured',
      'failed', 'refunded', 'partially_refunded'
    )),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on payments(order_id);

create table if not exists inventory_moves (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  variant_id uuid references product_variants(id) on delete restrict,
  delta integer not null,
  reason text not null
    check (reason in ('order', 'cancel', 'return', 'manual', 'restock')),
  order_id uuid references orders(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists inventory_moves_product_id_idx
  on inventory_moves(product_id);
create index if not exists inventory_moves_order_id_idx
  on inventory_moves(order_id);

create table if not exists coupons (
  code citext primary key,
  type text not null check (type in ('percent', 'fixed')),
  value numeric(10, 2) not null,
  min_subtotal numeric(10, 2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  is_active boolean not null default true
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  carrier text,
  awb text,
  status text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists shipments_order_id_idx on shipments(order_id);

-- ---------------------------------------------------------------------------
-- 2. Stock functions
-- ---------------------------------------------------------------------------

create or replace function decrement_stock(
  p_variant_id uuid,
  p_product_id uuid,
  p_qty int,
  p_order_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available int;
begin
  if p_qty <= 0 then
    raise exception 'decrement qty must be positive';
  end if;

  if p_variant_id is not null then
    select stock_count into v_available
      from product_variants
     where id = p_variant_id
       for update;
  else
    select stock_count into v_available
      from products
     where id = p_product_id
       for update;
  end if;

  if v_available is null then
    raise exception 'stock row not found';
  end if;

  if v_available < p_qty then
    raise exception 'insufficient stock: % available, % requested', v_available, p_qty;
  end if;

  if p_variant_id is not null then
    update product_variants
       set stock_count = stock_count - p_qty
     where id = p_variant_id;
  else
    update products
       set stock_count = stock_count - p_qty
     where id = p_product_id;
  end if;

  insert into inventory_moves (product_id, variant_id, delta, reason, order_id)
  values (p_product_id, p_variant_id, -p_qty, 'order', p_order_id);
end;
$$;

create or replace function restock(
  p_variant_id uuid,
  p_product_id uuid,
  p_qty int,
  p_order_id uuid,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty <= 0 then
    raise exception 'restock qty must be positive';
  end if;

  if p_reason not in ('cancel', 'return', 'manual', 'restock') then
    raise exception 'invalid restock reason: %', p_reason;
  end if;

  if p_variant_id is not null then
    update product_variants
       set stock_count = stock_count + p_qty
     where id = p_variant_id;
    if not found then
      raise exception 'variant not found';
    end if;
  else
    update products
       set stock_count = stock_count + p_qty
     where id = p_product_id;
    if not found then
      raise exception 'product not found';
    end if;
  end if;

  insert into inventory_moves (product_id, variant_id, delta, reason, order_id)
  values (p_product_id, p_variant_id, p_qty, p_reason, p_order_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Coupon redemption
-- ---------------------------------------------------------------------------

create or replace function redeem_coupon(p_code citext)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon coupons%rowtype;
begin
  select * into v_coupon
    from coupons
   where code = p_code
     for update;

  if not found then
    raise exception 'coupon not found';
  end if;

  if not v_coupon.is_active then
    raise exception 'coupon inactive';
  end if;

  if v_coupon.starts_at is not null and now() < v_coupon.starts_at then
    raise exception 'coupon not yet valid';
  end if;

  if v_coupon.ends_at is not null and now() > v_coupon.ends_at then
    raise exception 'coupon expired';
  end if;

  if v_coupon.usage_limit is not null
     and v_coupon.used_count >= v_coupon.usage_limit then
    raise exception 'coupon usage limit exceeded';
  end if;

  update coupons
     set used_count = used_count + 1
   where code = p_code;
end;
$$;

revoke all on function decrement_stock(uuid, uuid, int, uuid) from public;
revoke all on function restock(uuid, uuid, int, uuid, text) from public;
revoke all on function redeem_coupon(citext) from public;

grant execute on function decrement_stock(uuid, uuid, int, uuid) to service_role;
grant execute on function restock(uuid, uuid, int, uuid, text) to service_role;
grant execute on function redeem_coupon(citext) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Row level security — admin / service role only
-- ---------------------------------------------------------------------------

alter table payments enable row level security;
alter table inventory_moves enable row level security;
alter table coupons enable row level security;
alter table shipments enable row level security;

drop policy if exists "Admins manage payments" on payments;
create policy "Admins manage payments"
  on payments for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins manage inventory_moves" on inventory_moves;
create policy "Admins manage inventory_moves"
  on inventory_moves for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins manage coupons" on coupons;
create policy "Admins manage coupons"
  on coupons for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins manage shipments" on shipments;
create policy "Admins manage shipments"
  on shipments for all to authenticated
  using (is_admin())
  with check (is_admin());
