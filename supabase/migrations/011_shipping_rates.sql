-- 011_shipping_rates.sql — shipping options, product tax metadata
-- Prompt 25.

-- TODO: confirm HSN codes and GST slabs with the accountant.

alter table products add column if not exists tax_rate numeric(5, 2) not null default 5.00;
alter table products add column if not exists hsn_code text;

create table if not exists shipping_rates (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  free_above numeric(10, 2) check (free_above is null or free_above >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists shipping_rates_active_idx
  on shipping_rates (sort_order)
  where is_active = true;

insert into shipping_rates (code, label, amount, free_above, sort_order)
values
  ('standard', 'Standard delivery (5–7 business days)', 99.00, 2999.00, 1),
  ('express', 'Express delivery (2–3 business days)', 199.00, null, 2)
on conflict (code) do nothing;

alter table shipping_rates enable row level security;

drop policy if exists "Public read active shipping rates" on shipping_rates;
create policy "Public read active shipping rates"
  on shipping_rates for select to anon, authenticated
  using (is_active = true or is_admin());

drop policy if exists "Admins manage shipping rates" on shipping_rates;
create policy "Admins manage shipping rates"
  on shipping_rates for all to authenticated
  using (is_admin())
  with check (is_admin());
