# Remediation progress

Branch: remediation · Started: 16 Aug 2026

## Phase 0 — Stabilise
- [x] 01-schema-baseline-rls — **done**
- [x] 02-lock-down-reviews — **done**
- [ ] 03-fix-revalidate
- [ ] 04-error-handling
- [ ] 05-search-sanitise

## Phase 1 — Storefront rebuild
- [ ] 06-storefront-tokens
- [ ] 07-storefront-shell-swap
- [ ] 08-navbar-rebuild
- [ ] 09a-footer
- [ ] 09b-static-pages
- [ ] 10-product-card
- [ ] 11-image-optimisation
- [ ] 12a-pdp-layout
- [ ] 12b-pdp-gallery-and-selectors
- [ ] 12c-remaining-storefront-surfaces
- [ ] 13-accessibility
- [ ] 14-dead-code

## Phase 2 — Performance & SEO
- [ ] 15-restore-isr
- [ ] 16-query-dedupe
- [ ] 17-indexes-and-fts
- [ ] 18a-category-query-and-pagination
- [ ] 18b-filter-ui-and-facets
- [ ] 19-single-query-layer
- [ ] 20-sitemap-robots
- [ ] 21-structured-data

## Phase 3 — Commerce
- [ ] 22a-commerce-schema-core
- [ ] 22b-commerce-schema-support
- [ ] 23-variants-admin
- [ ] 24a-cart-actions
- [ ] 24b-cart-ui
- [ ] 25-checkout
- [ ] 26-razorpay
- [ ] 27a-customer-accounts
- [ ] 27b-admin-orders
- [ ] 27c-email-and-verified-reviews

## Phase 4
- [ ] 28a-tests
- [ ] 28b-ci-and-monitoring

## Migrations awaiting manual run in Supabase

Run in this order, in the SQL Editor. See `supabase/migrations/README.md`.

| File | Written | Applied |
|---|---|---|
| `000_baseline.sql` | 01 | ☐ |
| `001_site_settings.sql` (amended — drops the two over-broad write policies) | 01 | ☐ |
| `003_admin_rls.sql` | 01 | ☐ |
| `004_review_moderation.sql` | 02 | ☐ |

> **`003` has a required manual follow-up.** Until a row exists in `admin_users`,
> every catalogue write is denied — including the admin dashboard. Immediately
> after running `003`:
>
> ```sql
> insert into admin_users (user_id)
> select id from auth.users where email = '<your admin email>'
> on conflict (user_id) do nothing;
> ```

## Blocked on Arif

| Prompt | What I need |
|---|---|
| 01 | Run `000`, `001`, `003` in the Supabase SQL Editor, then insert the `admin_users` row (SQL above). Also: Authentication → Providers → Email → turn off *Enable signups*, and check Advisors → Security reports no missing RLS. Nothing later in the plan is blocked on this, but the live site keeps its old, unreviewed policies until it is done. |
| 02 | Add `REVIEW_IP_SALT` to the Vercel project (production + preview + development). I generated one into `.env.local` for local work; production needs its own. Any 32-byte hex value: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Until it is set in Vercel, `POST /api/reviews` returns 503 by design rather than accepting unlimited unrate-limited submissions. Also run `004`. |

## Decisions and deviations

| Prompt | What I changed from the plan | Why |
|---|---|---|
| 01 | `001_site_settings.sql` **drops** its `auth.role() = 'authenticated'` insert/update policies rather than replacing them in place; the admin-gated replacements are created in `003_admin_rls.sql`. | The prompt asked for the replacements in `001`, but `001` runs before `003`, where `is_admin()` is defined. Creating them in `001` would fail on a fresh database. Net effect is identical and the run order now works. Between `001` and `003`, `site_settings` is read-only through the API — the safe default. |
| 01 | Added `updated_at` triggers + a `set_updated_at()` function to `000_baseline.sql`. | The tables have `updated_at` columns that nothing was reliably maintaining. Idempotent and no data change. |
| 01 | Storage policies are dropped via a `DO` block filtered to policies mentioning `product-images`, not a blanket drop on `storage.objects`. | `storage.objects` policies are shared across buckets. A blanket drop would have taken out the `site-config` bucket the settings fallback uses. |
| 01 | Added `admin_users` RLS (admin-only `select`, no write policies at all). | The prompt did not specify it. Without RLS the admin roster would be world-readable; with no write policies, membership can only be changed by the service role. |
| 01 | **Replaced `eslint.config.mjs` with `.eslintrc.json`.** | Not in scope, but the gate could not run: `next lint` on Next 14.2 + ESLint 8 does not read flat config, so it dropped into an interactive "how would you like to configure ESLint?" prompt and hung. Flat config is Next 15. Both `next/core-web-vitals` and `next/typescript` exist in the installed `eslint-config-next@14.2.35`. |
| 01 | Fixed three unused-variable lint errors outside the stated scope: `cn` in `CategoryTreeView.tsx`, `sidebarOpen` in `V18TopNav.tsx`, `REVALIDATE_SECONDS` in `HomePageClient.tsx`. | Repairing the lint config unmasked them, and the rule is never to commit on a red gate. All three are pure deletions of unused declarations. This breaks prompt 01's "no application source file changed" criterion — deliberately, and it is the only way to have both a working lint script and a green gate. |
| 02 | Rate limiting is one `check_review_rate_limit()` Postgres function called over RPC, not select-then-upsert from the route. | The prompt asked for check-and-increment "in the same request". Two round trips from Node is racy — concurrent submissions read the same count and both pass. One statement in Postgres makes it atomic, and the cleanup `delete` still runs on the same path. |
| 02 | `004` adds `status` with default `'approved'` then changes the default to `'pending'`, instead of a separate `update` backfill. | Same end state on first run, but re-running the file cannot approve whatever is sitting in the moderation queue. A literal backfill statement would have been a re-run footgun that silently publishes pending spam. Verified by re-running it twice against a pending row. |
| 02 | Query layer selects an explicit column list instead of `select("*")`; `createReview` returns only `{ id }`. | `ip_hash` lives on that table now. `*` would have shipped it to the browser in the GET response the first time someone forgot. |
| 02 | `POST /api/reviews` returns **503** when `REVIEW_IP_SALT` is unset, rather than proceeding. | Failing open would leave an unauthenticated, unrate-limited, service-role-backed write endpoint. Failing closed is the safe default and is loud enough to be noticed. |
| 02 | Link filter also applies to `author_name`, not just the body. | The prompt only asked for the body, but the display name is just as good a place to put a URL. |
| 02 | Added `.env.example` documenting all five environment variables. | The prompt asked me to "document" `REVIEW_IP_SALT` and there was nowhere to do it — no env documentation existed at all. |

## Verification notes

`01` — migrations were not merely inspected. Ran them against a throwaway
`postgres:16` container with minimal `auth` / `storage` schema stubs
(`docker` container `aasi-pgtest`, kept alive for later migration prompts):

- All four files apply cleanly to an empty database, in order.
- **Caught a real bug this way:** the first draft dropped only legacy policy
  names, so a second run failed with `policy "Admins insert categories" already
  exists`. Fixed by also dropping every policy name the file creates. Three
  consecutive full runs are now clean.
- Seeded rows survive re-runs unchanged (`categories/products/variants/setting`
  counts identical before and after).
- Boundary behaviour, verified as each role rather than assumed:
  anon sees 1 of 2 products (active only); anon `insert` is rejected by RLS;
  a signed-up non-admin `delete from products` affects 0 rows and sees only the
  active product; the admin sees both and can insert; anon can still read
  `site_settings`; anon sees only the variant whose parent product is active.

`02` — verified against a second throwaway database (`aasi2`) built by running
`000 → 004` in order, with a review inserted *before* `004` so the backfill had
something to act on:

- Pre-existing review backfilled to `approved`; a review inserted afterwards
  defaults to `pending`.
- **Re-running `004` twice left the pending review pending** — the specific
  regression the two-step default is there to prevent.
- As `anon`: only the approved review is visible, and `review_rate_limits`
  returns 0 rows (RLS on, no policies, service-role only).
- `check_review_rate_limit('…', 3)` called five times returns `t,t,t,f,f`, so
  the fourth submission in an hour is the one that gets 429.
- The rate-limit table holds only the hash; no raw IP is written anywhere.

Not verified end-to-end over HTTP (no running dev server against live
Supabase); the boundary was tested at the database layer instead.

## Deferred

| Issue | Which prompt should own it |
|---|---|
| `components/storefront/ProductReviews.tsx` is a storefront component still using `v18-*` classes (`v18-card`, `v18-text-heading`, `v18-text-muted`, `border-v18-border`). Left alone deliberately — restyling it now would collide with the shell swap. | 07-storefront-shell-swap / 12a-pdp-layout |
| No admin UI for the moderation queue — reviews can only be approved with SQL. Nothing in the plan appears to add one. | flagged for Arif; 27b-admin-orders is the closest owner |
| `@eslint/eslintrc` is now an unused devDependency (it existed only for `FlatCompat` in the deleted `eslint.config.mjs`). | 14-dead-code |
| Every route builds as dynamic (`ƒ`), including `/`. Expected at this stage. | 15-restore-isr |
| Pre-existing uncommitted work was in the tree at the start of this run — `RemoteImage.tsx`, `ImageUploader.tsx`, `ProductTable.tsx`, `next.config.mjs`, `lib/storage/images.ts` and five storefront components. Committed untouched as its own commit so later diffs stay honest. It looks like partial image-optimisation work. | 11-image-optimisation |
