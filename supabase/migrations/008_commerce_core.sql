-- 008_commerce_core.sql — carts, orders, addresses; stock column fix
-- Prompt 22a. (007 is reorder_categories from prompt 19.)

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- 1. Fix products.in_stock / stock_count contradiction
-- ---------------------------------------------------------------------------

do $stock$
declare
  backfilled_ids uuid[];
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'in_stock'
      and is_generated = 'NEVER'
  ) then
    return;
  end if;

  select coalesce(array_agg(id), '{}')
    into backfilled_ids
    from products
   where in_stock = true
     and coalesce(stock_count, 0) = 0;

  -- Review these ids manually with Arif — placeholder stock_count = 1 applied.
  raise notice '22a stock backfill (stock_count set to 1): %', backfilled_ids;

  update products
     set stock_count = 1
   where in_stock = true
     and coalesce(stock_count, 0) = 0;

  update products
     set stock_count = 0
   where in_stock = false;

  alter table products drop column in_stock;
  alter table products add column in_stock boolean
    generated always as (stock_count > 0) stored;
end $stock$;

alter table product_variants
  alter column stock_count set default 0;

alter table product_variants
  alter column stock_count set not null;

-- ---------------------------------------------------------------------------
-- 2. Order number sequence
-- ---------------------------------------------------------------------------

create sequence if not exists order_number_seq;

create or replace function generate_order_number()
returns text
language plpgsql
set search_path = public
as $$
declare
  year_part text := to_char(now(), 'YYYY');
  seq_part bigint;
begin
  seq_part := nextval('order_number_seq');
  return format('AAS-%s-%s', year_part, lpad(seq_part::text, 5, '0'));
end;
$$;

revoke all on function generate_order_number() from public;
grant execute on function generate_order_number() to authenticated;

create or replace function set_order_number()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := generate_order_number();
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Cart session claim (guest carts; populated by server in prompt 24a)
-- ---------------------------------------------------------------------------

create or replace function request_cart_session_id()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
begin
  begin
    claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    return null;
  end;

  return claims ->> 'cart_session_id';
end;
$$;

revoke all on function request_cart_session_id() from public;
grant execute on function request_cart_session_id() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Commerce tables
-- ---------------------------------------------------------------------------

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  status text not null default 'active'
    check (status in ('active', 'converted', 'abandoned')),
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

create unique index if not exists carts_active_session_idx
  on carts (session_id)
  where status = 'active';

create index if not exists carts_user_id_idx on carts(user_id);

drop trigger if exists carts_set_updated_at on carts;
create trigger carts_set_updated_at
  before update on carts
  for each row execute function set_updated_at();

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  variant_id uuid references product_variants(id) on delete restrict,
  qty integer not null check (qty > 0),
  unit_price_snapshot numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);

create index if not exists cart_items_cart_id_idx on cart_items(cart_id);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  country text not null default 'IN',
  phone text,
  type text not null check (type in ('shipping', 'billing')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on addresses(user_id);

drop trigger if exists addresses_set_updated_at on addresses;
create trigger addresses_set_updated_at
  before update on addresses
  for each row execute function set_updated_at();

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  email citext not null,
  phone text,
  status text not null default 'pending'
    check (status in (
      'pending', 'confirmed', 'packed', 'shipped',
      'delivered', 'cancelled', 'returned'
    )),
  payment_status text not null default 'unpaid'
    check (payment_status in (
      'unpaid', 'paid', 'failed', 'refunded', 'partially_refunded'
    )),
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  shipping_fee numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  currency text not null default 'INR',
  coupon_code text,
  shipping_address jsonb not null,
  billing_address jsonb,
  notes text,
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists orders_order_number_idx on orders(order_number);

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

drop trigger if exists orders_set_order_number on orders;
create trigger orders_set_order_number
  before insert on orders
  for each row execute function set_order_number();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  name_snapshot text not null,
  slug_snapshot text not null,
  sku_snapshot text,
  image_snapshot text,
  size text,
  color text,
  qty integer not null check (qty > 0),
  unit_price numeric(10, 2) not null,
  tax_rate numeric(5, 2) not null default 0,
  line_total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on order_items(order_id);

-- ---------------------------------------------------------------------------
-- 5. Row level security
-- ---------------------------------------------------------------------------

alter table carts enable row level security;
alter table cart_items enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- carts
drop policy if exists "Cart owners read carts" on carts;
create policy "Cart owners read carts"
  on carts for select to anon, authenticated
  using (
    is_admin()
    or (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = request_cart_session_id())
  );

drop policy if exists "Cart owners insert carts" on carts;
create policy "Cart owners insert carts"
  on carts for insert to anon, authenticated
  with check (
    is_admin()
    or (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = request_cart_session_id())
  );

drop policy if exists "Cart owners update carts" on carts;
create policy "Cart owners update carts"
  on carts for update to anon, authenticated
  using (
    is_admin()
    or (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = request_cart_session_id())
  )
  with check (
    is_admin()
    or (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = request_cart_session_id())
  );

drop policy if exists "Cart owners delete carts" on carts;
create policy "Cart owners delete carts"
  on carts for delete to anon, authenticated
  using (
    is_admin()
    or (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = request_cart_session_id())
  );

-- cart_items (via parent cart)
drop policy if exists "Cart owners read cart_items" on cart_items;
create policy "Cart owners read cart_items"
  on cart_items for select to anon, authenticated
  using (
    exists (
      select 1 from carts c
      where c.id = cart_id
        and (
          is_admin()
          or (c.user_id is not null and c.user_id = auth.uid())
          or (c.user_id is null and c.session_id = request_cart_session_id())
        )
    )
  );

drop policy if exists "Cart owners insert cart_items" on cart_items;
create policy "Cart owners insert cart_items"
  on cart_items for insert to anon, authenticated
  with check (
    exists (
      select 1 from carts c
      where c.id = cart_id
        and (
          is_admin()
          or (c.user_id is not null and c.user_id = auth.uid())
          or (c.user_id is null and c.session_id = request_cart_session_id())
        )
    )
  );

drop policy if exists "Cart owners update cart_items" on cart_items;
create policy "Cart owners update cart_items"
  on cart_items for update to anon, authenticated
  using (
    exists (
      select 1 from carts c
      where c.id = cart_id
        and (
          is_admin()
          or (c.user_id is not null and c.user_id = auth.uid())
          or (c.user_id is null and c.session_id = request_cart_session_id())
        )
    )
  )
  with check (
    exists (
      select 1 from carts c
      where c.id = cart_id
        and (
          is_admin()
          or (c.user_id is not null and c.user_id = auth.uid())
          or (c.user_id is null and c.session_id = request_cart_session_id())
        )
    )
  );

drop policy if exists "Cart owners delete cart_items" on cart_items;
create policy "Cart owners delete cart_items"
  on cart_items for delete to anon, authenticated
  using (
    exists (
      select 1 from carts c
      where c.id = cart_id
        and (
          is_admin()
          or (c.user_id is not null and c.user_id = auth.uid())
          or (c.user_id is null and c.session_id = request_cart_session_id())
        )
    )
  );

-- addresses
drop policy if exists "Users read own addresses" on addresses;
create policy "Users read own addresses"
  on addresses for select to authenticated
  using (user_id = auth.uid() or is_admin());

drop policy if exists "Users insert own addresses" on addresses;
create policy "Users insert own addresses"
  on addresses for insert to authenticated
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "Users update own addresses" on addresses;
create policy "Users update own addresses"
  on addresses for update to authenticated
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "Users delete own addresses" on addresses;
create policy "Users delete own addresses"
  on addresses for delete to authenticated
  using (user_id = auth.uid() or is_admin());

-- orders
drop policy if exists "Customers read own orders" on orders;
create policy "Customers read own orders"
  on orders for select to authenticated
  using (user_id = auth.uid() or is_admin());

drop policy if exists "Admins insert orders" on orders;
create policy "Admins insert orders"
  on orders for insert to authenticated
  with check (is_admin());

drop policy if exists "Admins update orders" on orders;
create policy "Admins update orders"
  on orders for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins delete orders" on orders;
create policy "Admins delete orders"
  on orders for delete to authenticated
  using (is_admin());

-- order_items
drop policy if exists "Customers read own order_items" on order_items;
create policy "Customers read own order_items"
  on order_items for select to authenticated
  using (
    is_admin()
    or exists (
      select 1 from orders o
      where o.id = order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins write order_items" on order_items;
create policy "Admins write order_items"
  on order_items for all to authenticated
  using (is_admin())
  with check (is_admin());
