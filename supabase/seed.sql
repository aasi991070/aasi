-- supabase/seed.sql — deterministic E2E fixture catalogue (prompt 28a)
-- Idempotent: safe to re-run. Uses fixed UUIDs and ON CONFLICT.

-- Categories: 4 rows across 3 levels
insert into categories (id, name, slug, level, sort_order, is_active)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Men''s', 'seed-mens', 1, 1, true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Clothing', 'seed-clothing', 2, 1, true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'Shirts', 'seed-shirts', 3, 1, true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'Casual', 'seed-casual', 4, 1, true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  level = excluded.level,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

update categories set parent_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';

update categories set parent_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';

update categories set parent_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4';

-- 12 products: 2 on sale, 1 OOS, 1 inactive, 3 with variants
insert into products (
  id, name, slug, description, price, sale_price, category_id, gender,
  sizes, colors, images, stock_count, is_featured, is_active, tags
) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'Seed Smoke Shirt', 'seed-smoke-shirt', 'Primary E2E product', 1299, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M,L}', '{black}', '{}', 10, true, true, '{seed}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'Seed Sale Kurta', 'seed-sale-kurta', 'On sale', 2499, 1999, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M}', '{beige}', '{}', 8, false, true, '{seed,sale}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'Seed Discount Tee', 'seed-discount-tee', 'On sale', 999, 799, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{S,M}', '{white}', '{}', 5, false, true, '{seed,sale}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'Seed OOS Kurta', 'seed-oos-kurta', 'Out of stock', 1599, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M}', '{navy}', '{}', 0, false, true, '{seed,oos}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'Seed Inactive Coat', 'seed-inactive-coat', 'Inactive', 4999, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{L}', '{grey}', '{}', 3, false, false, '{seed}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 'Seed Classic Shirt 6', 'seed-classic-shirt-6', 'Catalogue filler', 1199, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M}', '{black}', '{}', 6, false, true, '{seed}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7', 'Seed Classic Shirt 7', 'seed-classic-shirt-7', 'Catalogue filler', 1199, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M}', '{black}', '{}', 6, false, true, '{seed}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8', 'Seed Classic Shirt 8', 'seed-classic-shirt-8', 'Catalogue filler', 1199, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M}', '{black}', '{}', 6, false, true, '{seed}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9', 'Seed Classic Shirt 9', 'seed-classic-shirt-9', 'Catalogue filler', 1199, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M}', '{black}', '{}', 6, false, true, '{seed}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbba', 'Seed Classic Shirt 10', 'seed-classic-shirt-10', 'Catalogue filler', 1199, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M}', '{black}', '{}', 6, false, true, '{seed}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Seed Classic Shirt 11', 'seed-classic-shirt-11', 'Catalogue filler', 1199, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M}', '{black}', '{}', 6, false, true, '{seed}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc', 'Seed Classic Shirt 12', 'seed-classic-shirt-12', 'Catalogue filler', 1199, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'men', '{M}', '{black}', '{}', 6, false, true, '{seed}')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  price = excluded.price,
  sale_price = excluded.sale_price,
  stock_count = excluded.stock_count,
  is_active = excluded.is_active;

insert into product_variants (id, product_id, size, color, stock_count, sku, is_enabled)
values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'M', 'black', 5, 'SEED-SMOKE-M-BLACK', true),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'L', 'black', 5, 'SEED-SMOKE-L-BLACK', true),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'M', 'beige', 8, 'SEED-SALE-M-BEIGE', true)
on conflict (id) do update set
  stock_count = excluded.stock_count,
  is_enabled = excluded.is_enabled;
