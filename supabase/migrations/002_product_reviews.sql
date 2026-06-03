-- Run in Supabase SQL Editor for product reviews.

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_product_id_idx
  on product_reviews(product_id);

alter table product_reviews enable row level security;

drop policy if exists "Public read reviews" on product_reviews;
create policy "Public read reviews"
  on product_reviews
  for select
  using (true);
