# 01 — Version-control the schema and lock down catalogue writes

**Scope:** `supabase/migrations/` only. Do not touch application code.

## Context

`supabase/migrations/` contains only `001_site_settings.sql` and
`002_product_reviews.sql`. The `products`, `categories`, and `product_variants`
tables exist only in the live Supabase project — their definitions, indexes,
and RLS policies are not in the repo, so nobody can review or reproduce them.

Meanwhile `hooks/useProducts.ts` and `hooks/useCategories.ts` perform
`.insert()`, `.update()`, and `.delete()` on those tables **from the browser**
using the anon key. Write authorisation therefore rests entirely on RLS
policies we cannot see. If they grant writes to any `authenticated` user and
Supabase signup is open, anyone who registers can delete the catalogue.

## Task

Create `supabase/migrations/000_baseline.sql` containing the current schema,
written so it is safe to run against the existing database (`create table if
not exists`, `create index if not exists`, `drop policy if exists` before each
`create policy`). Base the column definitions on `types/index.ts` and the
schema block in `cursor-master-prompt.md` (§ "Supabase Schema").

Tables: `categories`, `products`, `product_variants`.

Then create `supabase/migrations/003_admin_rls.sql` that:

1. Creates an `admin_users` table:
   ```sql
   create table if not exists admin_users (
     user_id uuid primary key references auth.users(id) on delete cascade,
     created_at timestamptz not null default now()
   );
   ```
2. Adds a `security definer` helper:
   ```sql
   create or replace function is_admin() returns boolean
   language sql stable security definer set search_path = public as $$
     select exists (select 1 from admin_users where user_id = auth.uid());
   $$;
   ```
3. Enables RLS on `categories`, `products`, `product_variants` and replaces
   every policy with:
   - `select` for `anon` and `authenticated` — **only where `is_active = true`**
     (`product_variants`: only where the parent product is active)
   - `insert` / `update` / `delete` — `using (is_admin())` and
     `with check (is_admin())`
   - a separate `select` policy allowing `is_admin()` to read inactive rows
4. Applies the same admin gate to the `product-images` storage bucket policies
   and to `site_settings` (currently `auth.role() = 'authenticated'`, which is
   too broad).

**Do not gate `select` on `site_settings`.** Its existing `Public read using (true)`
policy (`001_site_settings.sql:21-24`) is correct and prompt 15 depends on an
anonymous read. Only replace its `insert` and `update` policies (lines 26-35),
which currently use the over-broad `auth.role() = 'authenticated'`. Editing
`001_site_settings.sql` in place is authorised for this prompt.

Add `supabase/migrations/README.md` documenting: numbering (see below), run
order, that migrations are applied by hand in the Supabase SQL Editor today,
and the manual follow-up steps.

**Migration numbering.** Reserve the sequence now so later prompts do not
collide. Record this table in that README:

```
000 baseline schema          (this prompt)
003 admin RLS                (this prompt)
004 review moderation        (prompt 02)
005 site content tables      (prompt 09a)
006 search + indexes         (prompt 17)
007 commerce core            (prompt 22a)
008 commerce support         (prompt 22b)
009 product SEO + variants   (prompt 23)
010 shipping rates           (prompt 25)
011 order events            (prompt 27b)
012 email log                (prompt 27c)
```

## Also add the typecheck script

`package.json` currently defines only `dev`, `build`, `start`, `lint`. Every
later prompt's acceptance depends on `npm run typecheck`. Add it here:

```json
"typecheck": "tsc --noEmit"
```

## Manual steps to document (do not automate)

- Disable public signup: Supabase Dashboard → Authentication → Providers →
  Email → turn off "Enable signups".
- Insert the single admin user into `admin_users`.
- Run the Supabase advisors and confirm no table reports missing RLS.

## Acceptance

- Running all migrations against a fresh Postgres succeeds.
- Running them against the existing project is a no-op for data.
- No policy anywhere references `auth.role() = 'authenticated'`.
- `site_settings` is still readable anonymously.
- `npm run typecheck` exists and passes.
- No application source file changed (`package.json` excepted).
