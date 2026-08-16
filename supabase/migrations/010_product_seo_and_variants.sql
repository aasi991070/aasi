-- 010_product_seo_and_variants.sql — SEO columns, variant admin fields, save RPC
-- Prompt 23.

alter table products add column if not exists meta_title text;
alter table products add column if not exists meta_description text;
alter table products add column if not exists image_alts text[] not null default '{}';

alter table product_variants add column if not exists price_override numeric(10,2)
  check (price_override is null or price_override >= 0);

alter table product_variants add column if not exists is_enabled boolean not null default true;

create unique index if not exists product_variants_product_size_color_idx
  on product_variants (product_id, size, color)
  where size is not null and color is not null;

create or replace function save_product_variants(
  p_product_id uuid,
  p_variants jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_id uuid;
  v_size text;
  v_color text;
  v_incoming uuid[] := '{}';
  v_existing uuid;
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;

  if not exists (select 1 from products where id = p_product_id) then
    raise exception 'product not found';
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_variants, '[]'::jsonb))
  loop
    v_id := nullif(trim(v_row->>'id'), '')::uuid;
    v_size := nullif(trim(v_row->>'size'), '');
    v_color := lower(nullif(trim(v_row->>'color'), ''));

    if v_size is null or v_color is null then
      continue;
    end if;

    if v_id is not null then
      update product_variants
         set size = v_size,
             color = v_color,
             stock_count = greatest(coalesce((v_row->>'stock_count')::int, 0), 0),
             sku = nullif(trim(v_row->>'sku'), ''),
             price_override = nullif(trim(v_row->>'price_override'), '')::numeric,
             is_enabled = coalesce((v_row->>'is_enabled')::boolean, true)
       where id = v_id and product_id = p_product_id;

      if found then
        v_incoming := array_append(v_incoming, v_id);
      end if;
    else
      select id into v_id
        from product_variants
       where product_id = p_product_id
         and size = v_size
         and lower(color) = v_color;

      if v_id is not null then
        update product_variants
           set stock_count = greatest(coalesce((v_row->>'stock_count')::int, 0), 0),
               sku = nullif(trim(v_row->>'sku'), ''),
               price_override = nullif(trim(v_row->>'price_override'), '')::numeric,
               is_enabled = coalesce((v_row->>'is_enabled')::boolean, true)
         where id = v_id;
      else
        insert into product_variants (
          product_id, size, color, stock_count, sku, price_override, is_enabled
        ) values (
          p_product_id,
          v_size,
          v_color,
          greatest(coalesce((v_row->>'stock_count')::int, 0), 0),
          nullif(trim(v_row->>'sku'), ''),
          nullif(trim(v_row->>'price_override'), '')::numeric,
          coalesce((v_row->>'is_enabled')::boolean, true)
        )
        returning id into v_id;
      end if;

      v_incoming := array_append(v_incoming, v_id);
    end if;
  end loop;

  for v_existing in
    select id from product_variants
     where product_id = p_product_id
       and (cardinality(v_incoming) = 0 or id != all(v_incoming))
  loop
    if exists (select 1 from order_items where variant_id = v_existing) then
      update product_variants
         set is_enabled = false,
             stock_count = 0
       where id = v_existing;
    else
      delete from product_variants where id = v_existing;
    end if;
  end loop;

  update products
     set stock_count = coalesce((
       select sum(stock_count)
         from product_variants
        where product_id = p_product_id
          and is_enabled = true
     ), 0),
         updated_at = now()
   where id = p_product_id;
end;
$$;

revoke all on function save_product_variants(uuid, jsonb) from public;
grant execute on function save_product_variants(uuid, jsonb) to authenticated;
