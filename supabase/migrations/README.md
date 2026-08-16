# Supabase migrations

## How these are applied

**By hand, in the Supabase SQL Editor.** There is no migration runner wired up
and no `supabase db push` in CI. Open each file in numeric order, paste it into
the SQL Editor, run it, then tick it off in the root `PROGRESS.md`.

Because of that, every file here must be **idempotent and safe against the live
database**:

- `create table if not exists`, `create index if not exists`
- `drop policy if exists` before each `create policy`
- `create or replace function`
- inserts guarded with `on conflict … do nothing`

Re-running the whole directory against production should change no data.

## Run order

| File | What it does | Written by |
|---|---|---|
| `000_baseline.sql` | `categories`, `products`, `product_variants` — tables, indexes, `updated_at` triggers | prompt 01 |
| `001_site_settings.sql` | singleton `site_settings` row, public read | pre-existing, amended by prompt 01 |
| `002_product_reviews.sql` | `product_reviews` table | pre-existing |
| `003_admin_rls.sql` | `admin_users`, `is_admin()`, all catalogue + storage + settings policies | prompt 01 |
| `010_product_seo_and_variants.sql` | product SEO columns, variant admin fields, `save_product_variants` RPC | prompt 23 |
| `011_shipping_rates.sql` | `shipping_rates` table, `products.tax_rate` / `hsn_code` | prompt 25 |
| `012_order_events.sql` | `order_events` audit trail, `get_sales_metrics` RPC | prompt 27b |
| `013_email_log.sql` | `email_log`, verified-review insert policies | prompt 27c |

`000` must run before `002`, which has a foreign key to `products`.
`003` must run last of the four: `001` deliberately leaves `site_settings`
without write policies, and `003` supplies the admin-gated replacements once
`is_admin()` exists.

## Reserved numbering

Claimed up front so later prompts do not collide. Do not renumber.

```
000 baseline schema          01        007 reorder categories  19
001 site settings            (exists)  008 commerce core     22a
002 product reviews          (exists)  009 commerce support  22b
003 admin RLS                01        010 product SEO       23
004 review moderation        02        011 shipping rates    25
005 site content             09a       012 order events      27b
006 search + indexes         17 (18a and 18b append to it)  013 email log 27c
```

## Authorisation model

After `003`, the rule is uniform across the catalogue:

- **Read** — `anon` and `authenticated` see active rows only. `product_variants`
  inherits visibility from its parent product.
- **Write** — `insert`, `update` and `delete` all require `is_admin()`, which is
  membership of `admin_users`.
- **Admin read** — a separate `select` policy lets admins see inactive rows.

`site_settings` is the one deliberate exception: its `select` stays open to
everyone, because the storefront reads it anonymously to keep the root layout
static. Only its writes are gated.

No policy anywhere may use `auth.role() = 'authenticated'`. That check passes
for any signed-up user, which is not the same thing as an admin.

## Manual steps — not automated, and required

Run these after `003_admin_rls.sql`, in this order.

1. **Insert the admin user.** Until `admin_users` has a row, every catalogue
   write is denied and the admin UI will fail to save.

   ```sql
   insert into admin_users (user_id)
   select id from auth.users where email = 'you@example.com'
   on conflict (user_id) do nothing;
   ```

   Verify: `select * from admin_users;` should return one row.

2. **Disable public signup.** Dashboard → Authentication → Providers → Email →
   turn off *Enable signups*. With signup open, anyone can obtain an
   `authenticated` session; `is_admin()` still holds the line, but there is no
   reason to hand out sessions.

3. **Run the advisors.** Dashboard → Advisors → Security. Confirm no table
   reports missing RLS and no policy is flagged as overly permissive.
