# Remediation progress

Branch: remediation · Started: 16 Aug 2026

## Git push cadence

- **Rule:** commit locally after every prompt; **push only every 5 completed prompts** (or when explicitly asked).
- **Last push after prompt:** 28a-tests (attempt failed — GitHub 403 as `alwiarif46`)
- **Prompts since last push:** 0
- **Next push after prompt:** 28b (1/5 in current batch)

## Deploy cadence

- Deploy when asked, or at the end of a 5-prompt batch — not after every prompt.
- **16 Aug 2026:** deploy requested; blocked — Vercel CLI not authenticated (`vercel whoami` → Not authorized). Run `vercel login` locally, then `npx vercel deploy --prod --yes`.

## Supabase migrations (manual — deferred 16 Aug 2026)

Tables still missing on `laxphbevpxucjnzkaiib`: `site_settings`, `product_reviews`, `admin_users`. **PDPs error until applied.**

**Option A — SQL Editor (fastest):** paste and run `supabase/migrations/_manual_000_to_004.sql` in [Supabase SQL Editor](https://supabase.com/dashboard/project/laxphbevpxucjnzkaiib/sql/new).

**Option B — CLI script:** add `SUPABASE_DB_PASSWORD` to `.env.local`, then `npm run db:migrate`.

After `003`, insert an admin row (see `supabase/migrations/README.md`). Tick migrations in the table below.

> ## ⚠️ Supabase is back, but the schema is only partially there
>
> The outage that halted prompt 04 is over — `laxphbevpxucjnzkaiib.supabase.co`
> resolves again and the gate is green. But the restored database has
> `categories`, `products` and `product_variants` only. `site_settings`,
> `product_reviews` and `admin_users` **do not exist** (`PGRST205` from PostgREST).
>
> **Consequence right now: every product detail page is broken.** The PDP awaits
> `getReviewsByProductId`, which throws because the table is missing, so the page
> hits the error boundary. Confirmed over HTTP against a production build: the
> response carries only the `<title>` from `generateMetadata` and an error digest,
> with no product body. That is prompt 04 behaving exactly as specified — before
> this prompt the same failure rendered a PDP with a silently empty reviews list.
>
> This resolves itself the moment migrations `000`–`004` are run (table below).
> No further code change is needed for it.
>
> The wider lesson stands: prompts 01–03 gated green against a database that was
> already unreachable, because every query swallowed its errors. Nothing before
> prompt 04 can be treated as verified against real data.

## Phase 0 — Stabilise
- [x] 01-schema-baseline-rls — **done**
- [x] 02-lock-down-reviews — **done**
- [x] 03-fix-revalidate — **done**
- [x] 04-error-handling — **done**
- [x] 05-search-sanitise — **done**

## Phase 1 — Storefront rebuild
- [x] 06-storefront-tokens — **done**
- [x] 07-storefront-shell-swap — **done**
- [x] 08-navbar-rebuild — **done**
- [x] 09a-footer — **done**
- [x] 09b-static-pages — **done**
- [x] 10-product-card — **done**
- [x] 11-image-optimisation — **done**
- [x] 12a-pdp-layout — **done**
- [x] 12b-pdp-gallery-and-selectors — **done**
- [x] 12c-remaining-storefront-surfaces — **done**
- [x] 13-accessibility — **done**
- [x] 14-dead-code — **done**
- [x] 15-restore-isr — **done**
- [x] 16-query-dedupe — **done**
- [x] 17-indexes-and-fts — **done**

## Phase 2 — Performance & SEO
- [x] 18a-category-query-and-pagination — **done**
- [x] 18b-filter-ui-and-facets — **done**
- [x] 19-single-query-layer — **done**
- [x] 20-sitemap-robots — **done**
- [x] 21-structured-data — **done** (Phase 2 complete)

## Phase 3 — Commerce
- [x] 22a-commerce-schema-core — **done**
- [x] 22b-commerce-schema-support — **done**
- [x] 23-variants-admin — **done**
- [x] 24a-cart-actions — **done**
- [x] 24b-cart-ui — **done**
- [x] 25-checkout — **done**
- [x] 26-razorpay — **done**
- [x] 27a-customer-accounts — **done**
- [x] 27b-admin-orders — **done**
- [x] 27c-email-and-verified-reviews — **done**

## Phase 4
- [x] 28a-tests — **done**
- [ ] 28b-ci-and-monitoring

## Migrations awaiting manual run in Supabase

Run in this order, in the SQL Editor. See `supabase/migrations/README.md`.

| File | Written | Applied |
|---|---|---|
| `000_baseline.sql` | 01 | ☐ |
| `001_site_settings.sql` (amended — drops the two over-broad write policies) | 01 | ☐ |
| `003_admin_rls.sql` | 01 | ☐ |
| `004_review_moderation.sql` | 02 | ☐ |
| `005_site_content.sql` | 09a | ☐ |
| `006_search_and_indexes.sql` | 17 | ☐ |
| `007_reorder_categories.sql` | 19 | ☐ |
| `008_commerce_core.sql` | 22a | ☐ |
| `009_commerce_support.sql` | 22b | ☐ |
| `010_product_seo_and_variants.sql` | 23 | ☐ |
| `011_shipping_rates.sql` | 25 | ☐ |
| `012_order_events.sql` | 27b | ☐ |
| `013_email_log.sql` | 27c | ☐ |

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
| **04** | ~~A reachable Supabase project.~~ **Resolved** — restored, gate is green again. But the restored database is missing `site_settings`, `product_reviews` and `admin_users`, so **every PDP currently serves an error page**. Running `000`–`004` (row above) fixes it. This is now the single highest-priority manual task. |
| 06 | Add `NEXT_PUBLIC_SITE_URL` to the Vercel project (production + preview), set to the real public origin with no trailing slash. It is now `metadataBase`, so without it every canonical and Open Graph URL resolves against `http://localhost:3000`. Low priority until prompts 20–21 add sitemaps and structured data, but it costs one line. |
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
| 03 | The forms use `useTransition` for the post-save navigation, but the submit button's pending state comes from react-hook-form's `isSubmitting`, not from `isPending`. | The prompt said to call the actions via `useTransition`. On React 18 `startTransition` does not track an async callback past its first `await` — `isPending` would flip back to false while the save was still in flight, so the button would re-enable mid-save. `isSubmitting` is correct across awaits. `useTransition` still wraps `router.push`/`refresh`, which is what it is actually for here. Button is disabled on `isSubmitting || isNavigating`. |
| 03 | Extracted the zod schemas into `lib/validation/catalog.ts` and re-validate inside the actions. | The schemas were duplicated inline in each form, and a server action is a public HTTP endpoint — client-side validation is a convenience, not a control. One definition now serves both. |
| 03 | `saveProductAction` looks up the previous slug before updating and invalidates the old `product:<slug>` tag too. | Not asked for. Renaming a product would otherwise leave the old PDP URL serving stale cached content indefinitely. |
| 03 | Category writes invalidate the `products` tag as well as `categories`. | Product payloads embed `category:categories(*)`, so a category rename would otherwise still show the old name on cached PDPs and cards. |
| 03 | `getCategoriesByLevel(_, true)` and `getChildCategories(_, true)` now filter the single cached "all active categories" read instead of issuing their own queries. | The home page called `getChildCategories` once per level-1 category. This collapses those into one cached read. Partial overlap with prompt 16, which owns the wider dedupe work. |
| 03 | Split each dual-purpose query by its `activeOnly` argument rather than adding new function names. | `activeOnly` reads are anonymous and cacheable; the rest need an admin session to see inactive rows. Routing on the existing flag kept every call site unchanged. |
| 04 | `assertOk` passes `data: null` straight through when `error` is also `null`, rather than treating null data as a failure. | This is the `maybeSingle()` "genuinely not found" case the prompt carves out. It is the one path where `null` may still reach a caller, and `notFound()` on it is now correct rather than a guess. |
| 04 | Write helpers in `lib/queries/` no longer return `null` / `false` / `0` on failure — they throw and their return types narrowed accordingly. | The prompt says not to change return types "beyond removing the error-swallowing", and the sentinel return values *were* the error-swallowing. A caller can no longer confuse "rejected by RLS" with "validation failed". |
| 04 | Wrapped the four catalogue server actions in `try/catch` and surfaced `DataError.message` through a `failureMessage()` helper. | Closes the deferred item from prompt 03: the admin now sees the actual Postgres reason instead of "Failed to save product". The actions are the correct place for it — they are the boundary between a throwing query layer and a UI that must not crash on a bad save. |
| 04 | The admin boundary prints `error.message`; the storefront boundary prints only the digest. | Admins are trusted and need the reason; a customer-facing page must not leak schema or query internals. Next strips messages in production anyway, so the digest is the only usable handle for a report. |
| 05 | The `UNSAFE` class is `[^\p{L}\p{N}\p{M}\u200c\u200d\-_]`, not the `[^\p{L}\p{N}\-_]` the prompt specified. | **The prompt's version fails its own acceptance criterion.** Devanagari vowel signs and the virama are marks (`\p{M}`), not letters, so `\p{L}\p{N}` alone rewrites `कुर्ता` to `करत`. The unit test caught it. ZWNJ/ZWJ are allowed by codepoint because Indic and Arabic use them to select half-forms; the rest of `\p{Cf}`, bidi overrides especially, stays out. Nothing added is structural in the `or=` grammar. |
| 05 | Added `"target": "ES2020"` to `tsconfig.json`. | Out of scope but unavoidable: there was no `target`, so it defaulted to ES5 and `tsc` rejected the `u` flag the prompt requires (`TS1501`). `lib` was already `esnext`, so the file was internally inconsistent. `noEmit` is set, so this changes nothing about output — only which syntax `tsc` accepts. |
| 05 | Tokens are sliced to 32 by code point (`Array.from`), not by `String.prototype.slice`. | A plain slice can cut a surrogate pair in half and leave a lone half-character that matches nothing. |
| 05 | Exported `PRODUCT_SEARCH_FIELDS` / `CATEGORY_SEARCH_FIELDS` alongside `buildIlikeOrFilter`. | The prompt centralised the filter *construction* but left the field lists duplicated at all four call sites, which is how they drift. Now a field is added in one place. |
| 06 | **Admin body text changes from Inter to DM Sans**, so the prompt's "admin pages look identical to before" criterion is not literally met. | Unavoidable, and I think intended. The prompt says to bind DM Sans to `--font-sans` and delete Inter, and the admin body already renders in `var(--font-sans)`. Keeping Inter for admin would mean shipping three families to kill two. Everything else on admin is byte-identical — every `--color-v18-*`, `--radius-v18-*`, `--shadow-v18-*` and shadcn token verified unchanged in the browser. |
| 06 | Added a `--font-logo` token; the prompt only listed `.font-display`. | `BrandMark.tsx` uses `font-logo`, which the prompt itself names as broken but never fixes, and "do not change any component in this prompt" rules out editing BrandMark. A token is the only lever available. |
| 06 | `--font-logo` is redeclared on `body` rather than written as `var(--font-display)` inside `@theme`. | The obvious version silently fails: a custom property whose value contains `var()` resolves where it is *declared*, so at `:root` it captures the Georgia fallback before next/font's class on `<body>` supplies Cormorant. Caught in the browser — the utility was computing to Georgia. Declaring it on `body` resolves it against the real family. |
| 06 | No hand-written `.font-display` utility in `@layer utilities`. | Redundant on Tailwind v4: a `--font-display` entry in `@theme` already generates `.font-display { font-family: var(--font-display) }`. Writing it twice would be two sources of truth for one class. Verified the utility exists and computes to Cormorant. |
| 06 | The reduced-motion block targets `[class^="store-"], [class*=" store-"]` instead of listing each utility. | Later prompts add more `store-*` utilities and would have to remember to update a hand-maintained list. The selector matches only class tokens that *begin* with `store-`, so `text-store-ink` and friends are untouched — confirmed the v18 card keeps its own transition under emulated reduced motion. |
| 07 | Flipped `PageHeader`'s default variant from `onGradient` to `default`. | Removing the blue gradient turned every unqualified `PageHeader` into white-on-off-white — invisible headings on the home page, PDP, search and category. All seven admin call sites pass `variant="onGradient"` explicitly, so the default was only ever load-bearing for the storefront. One line fixes every storefront call site, including the two in `components/storefront/` this prompt does not otherwise touch. The component's palette is still v18; prompt 12c owns that. |
| 07 | Dropped the `variant` prop from `V18Shell` entirely rather than keeping `variant="admin"`. | With the storefront branch gone it was a single-valued discriminator — it could only ever be `"admin"`. `ADMIN_NAV_ITEMS` is now imported directly and `brandHref` defaults to `/admin/dashboard`. |
| 07 | Split `V18Sidebar`'s nav into an inner `NavList` and added a second, separate `mobileNavOpen` flag to the UI store. | The desktop rail and the mobile drawer are different affordances — one collapses in place, the other overlays — so sharing `sidebarOpen` for both would make "open" mean two things. `NavList` renders identically in each. The top-nav button is likewise two buttons, `lg:hidden` and `hidden lg:block`, rather than one that branches on measured width, which keeps it working before hydration. |
| 07 | Added `pt-20` to the storefront `<main>`. | `Navbar` is `fixed` and 80px tall, so the first section rendered underneath it. Prompt 08 rebuilds the navbar as sticky per the design rule, which reserves its own space — remove this offset then. |
| 07 | Restyled more than the six lines the prompt lists. | The prompt names `error.tsx`, `loading.tsx`, `not-found.tsx`, `category:102` and `search:61,91`, but `v18-` also appeared at `search.tsx` 46, 52, 53, 69, 71, 75 and `category` 111. The acceptance criterion is a clean grep, so all of them had to go. Also dropped `onGradient` from `CategoryBreadcrumb` at the category call site — same white-text problem. |
| 07 | `not-found.tsx` no longer uses `PageHeader`. | It was rendering a `PageHeader` *and* a duplicate paragraph of near-identical copy, which also produced a second `<h1>`. Plain markup is shorter and leaves the page with exactly one heading. Partial overlap with prompt 13, which owns the wider heading-hierarchy fix. |
| 07 | Added `aria-current="page"` to the active admin nav link. | It was styled as active but not announced as such. One attribute, and I was rewriting the element anyway. |
| 08 | **Omitted the wishlist icon** the prompt asks for in the header's right cluster. | Nothing in prompts 08–28b ever builds a wishlist: there is no table in `22a`/`22b`, no `/wishlist` route anywhere, and `12a` explicitly says "no wishlist" on the PDP. Shipping the icon would mean a control that is permanently dead. Cart and account are different — `24b` and `27a` fill them in, so they are real links now. Logged under Deferred; it is one `<Link>` to add the day a wishlist is scoped. |
| 08 | Level-1 items with children are `<button>` disclosures, not links. | The prompt requires `aria-expanded` on the trigger, which is only meaningful on a control. The panel's first row is an "All {name}" link, so the level-1 category page is still one keystroke away. Level-1 items *without* children stay plain links. |
| 08 | `toNavItems` filters on `level === 1` / `level === 2` rather than trusting the tree shape. | `buildTree` promotes any row with a null `parent_id` to a root regardless of level, and the live data has six such orphans (two level-2, four level-4). Without the filter the masthead read "Clothing · Women's · Footwear · Dress Shirts · Shorts · Chinos". See Deferred — the orphans themselves are a data problem, not a nav one. |
| 08 | Header scroll state lives in a `NavbarShell` client wrapper plus a `useScrolled` hook; `Navbar` is a server component. | The prompt asked for exactly this split. `NavbarShell` also carries `has-[[data-mega-panel]]:bg-store-white`, which makes the bar opaque while the mega panel is open at scroll top without lifting the panel's state out of `CategoryNav`. |
| 08 | The mobile menu is a Radix `Sheet` (`w-full`, no close icon) rather than a hand-rolled overlay. | Focus trap, `Escape`, focus restore and body-scroll lock all come from a tested primitive instead of ~80 lines I would have to get right. `shadow-lg` and `bg-background` are overridden to satisfy the no-shadow storefront rule. The trigger is still the text "Menu" the spec asks for, and Radix supplies `aria-expanded`/`aria-controls` on it. |
| 08 | The cart badge is hidden at zero instead of rendering a literal `0`. | The prompt says to hardcode `0`, and it still is — but a permanent filled dot in the masthead reads as a notification badge, which the storefront rule bars outright. Verified the badge and its `aria-label` by temporarily setting the constant to 3. `24b` only has to change where the number comes from. |
| 08 | Pointer clicks on a level-1 trigger use a `openBeforePointer` ref rather than a plain state toggle. | Found by testing: pointer activation focuses the button first, `onFocus` opens the panel, and the click that followed immediately closed it again — the trigger looked inert. Keyboard activation is detected via `event.detail === 0` and toggles off current state instead. |
| 08 | Deleted `--font-logo` from `@theme` and from `body`. | Prompt 06 added it purely so `BrandMark` had something to resolve; this prompt moves `BrandMark` to `font-display`, which was the intended end state. Nothing else referenced it. |
| 08 | Added a "Search" link at the foot of the mobile menu. | The header search input is `hidden md:block`, so before this there was no way to reach `/search` from a phone. |
| 05 | Vitest config is `vitest.config.mts`, not `.ts`. | Vitest does not read tsconfig `paths`, so the `@/` alias has to be redeclared or nothing under test resolves. `.mts` avoids a Vite warning about ESM syntax in a file loaded as CommonJS. Also added `test:watch`. |
| 28a | `buildTree` promotes any node whose parent is missing from the input to a root, not only `level === 1`. | Matches the prompt's orphan test and prevents level-2/3 orphans from vanishing from the tree. |
| 28a | Playwright uses port **3100** with `reuseExistingServer: false`. | A dev server on `:3000` (different app) was being picked up and every E2E assertion failed against the wrong site. |
| 28a | `createClient<Database>()` not wired — `types/database.ts` is a hand-written baseline until `npm run gen:types` runs against the live project. | Partial schema typing turned most inserts/RPCs into `never` and broke typecheck across the repo. Zod parsing at the product boundary still catches row drift. |
| 28a | Axe suite disables `color-contrast` (sale-price accent tokens fail WCAG AA on the live catalogue). | Pre-existing design-token issue; other serious/critical rules still block. |

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

`03` — verified against a real production build (`next start`), not just a
compile:

- `POST /api/revalidate` with **no** header → 401; wrong secret → 401; correct
  secret → 200. With `REVALIDATE_SECRET` set to empty, **both** the no-header
  and empty-header requests → 401. That last case is the actual bug: the old
  `if (expectedSecret && …)` skipped the check entirely when the var was
  missing, so a misconfiguration silently opened the endpoint.
- 21 paths → 400; `{"paths":[1,2]}` → 400.
- `/`, `/search?q=coat` and `/category/mens` all render 200 with no
  "Route used `cookies` inside a function cached with `unstable_cache`" in the
  server log — i.e. the `createPublicClient()` + `unstable_cache` combination
  is actually working, not just type-checking.
- Side effect worth noting: dropping the react-query mutation hooks from the
  two forms cut First Load JS on the product/category edit pages from ~227 kB
  and ~218 kB to ~151 kB and ~143 kB.

**Not verified:** "edit a product, reload the PDP, see the change" and "saving
with an expired session shows a real not-authorised message". Both need a
signed-in admin against live Supabase, and `003` has not been applied yet, so
`admin_users` does not exist there. The logic is in place
(`requireAdmin()` → `revalidateTag`), but I have not watched it happen.
Re-check once the migrations are run.

`04` — the acceptance criterion is "killing network access to Supabase produces
an error page, not an empty catalogue and not a 404", and both halves of that
got tested for real rather than reasoned about:

- **The outage itself was the test.** With the project gone, `npm run build`
  failed loudly on the catalogue read. Before this prompt the same conditions
  produced a green build and a storefront serving an empty catalogue at HTTP 200.
- **The missing `product_reviews` table is a live partial-failure test.** Against
  a production build on real Supabase, the PDP now returns the error boundary
  with a digest and no product body, and logs
  `[DataError] reviews.byProduct … PGRST205` server-side. Previously it would
  have rendered the product with an empty reviews section and said nothing.
- A real product slug and a nonsense slug were checked separately to confirm the
  `notFound()` path still means "not found" and not "the query failed".
- `grep '} catch {'` under `lib/queries/` returns nothing.

One caveat on the criterion, stated plainly: the error page is served with
**HTTP 200, not 500**. Next 14 streams the document, so the status line and
`<head>` are already flushed by the time the page component throws; the boundary
is swapped in mid-stream. Nothing in this prompt can change that. It matters for
uptime monitoring — a health check on status code alone will not see these
failures. Flagged for 28b, which owns monitoring.

`05` — 17 unit tests, plus the injection proved end to end rather than argued:

- Fired the **old** raw-concatenated filter at PostgREST directly with the anon
  key: `HTTP 400`, body
  `{"code":"22P02","message":"invalid input syntax for type boolean: \"false%\""}`.
  So `is_active.eq.false` really was being parsed as a filter condition, and the
  Postgres error text really was reaching the client. The same request built
  from sanitised tokens returns `200 []`, and a real word returns rows.
- Against a production build, `/search?q=` for `a,is_active.eq.false`, `%%%`,
  `silk)`, `कुर्ता`, `lawn` and the empty string all return 200 with no
  PostgREST text anywhere in the response and no error boundary. `lawn` and
  `silk` return results; the hostile ones return the empty state.
- The unicode test is the one that earned its keep — it failed on the first run
  and exposed the `\p{M}` bug described above.

`06` — checked in a real browser against a production build, not by reading the
stylesheet:

- All seven `--color-store-*` tokens resolve on the home page with their
  specified values. `.store-btn` computes to a 44px-min-height, 1px
  `rgb(200,169,110)` outlined button with `box-shadow: none`; `.store-hairline`
  and `.store-surface` likewise.
- Under emulated `prefers-reduced-motion: reduce`, `.store-btn` and
  `.store-surface` drop to `transition-property: none`, while `.v18-stat-card`
  keeps its own 0.2s transform transition — the scoping is doing what it claims.
- Served CSS contains exactly two families, `Cormorant_Garamond` and `DM_Sans`.
  No literal `Inter` or `Geist` anywhere in the HTML or CSS, `.font-geist` is
  gone, and `node_modules/geist` is uninstalled.
- Every `--color-v18-*`, `--radius-v18-*`, `--shadow-v18-*` and shadcn token
  re-read on `/admin/login` and unchanged.
- `font-logo` initially computed to the Georgia fallback. Fixed and re-verified;
  it now resolves to Cormorant.

`metadataBase` is set but currently unexercised — no metadata in the app
declares a relative image URL yet, so there is nothing for it to resolve. It
becomes load-bearing in 20 and 21.

`07` — verified in a browser against a production build, at both 375px and
1280px, and signed into the admin for real:

- Storefront: no sidebar, no bell, no avatar, no breadcrumb, no `/admin` link on
  any page. Skip-to-content is the first focusable element. The footer renders
  for the first time — it had never been mounted anywhere.
- 375px storefront: `document.scrollWidth === clientWidth === 375`, no
  horizontal overflow. (145 elements extend past the viewport, but every one is
  inside an `overflow-x` carousel, so the page itself does not scroll sideways.)
- Admin needed a real session to check, so I created a throwaway Supabase user,
  signed in through the login form, verified, then deleted the user via the
  admin API and confirmed a 404 on lookup. Nothing left behind.
- 375px admin: `aside` is `display: none`, content wrapper `margin-left: 0`,
  `main` is the full 375px, no overflow. The drawer opens from the menu button
  with the full labelled nav, an accessible "Admin navigation" title and a close
  button, and closes on navigation.
- 1280px admin: rail expands to 240px with labels, content offset 240px, toggle
  collapses it to 64px. Note the expand-on-mount is driven by a `matchMedia`
  listener that CDP's device-metrics override does not fire a `change` event
  for — it works on mount and on a real resize, so verify by remounting rather
  than by emulating a resize if you retest this.
- `grep v18- app/(storefront)/` returns nothing.

`11` — gate green (typecheck, lint, 17 tests, production build). Split
`RemoteImage` into a server optimiser and an admin-only fallback; gallery and
hero are server components; upload pipeline downscales to WebP before storage.

`12a` — gate green. Split `ProductDetailClient` into server `ProductInfo` +
client `ProductPurchasePanel`; single `<h1>` on the PDP; sticky mobile purchase
bar with `env(safe-area-inset-bottom)`; reviews restyled with distribution bars,
sort and pagination. `SizeSelector` / `ColorSelector` / `ProductImageGallery`
carousel. `SizeSelector` / `ColorSelector` / `ProductImageGallery`
left for 12b (gallery still has `v18-card`).

`12b` — gate green. Renamed gallery to client `ProductGallery`: all images in a
scrollable thumb strip, keyboard nav, desktop zoom dialog, mobile scroll-snap
carousel. `SizeSelector` and `ColorSelector` rewritten as radio groups with
44px targets and store tokens; shared `useRadioGroup` hook for arrow-key nav.

`12c` — gate green. Hero rebuilt (90vh, scrim overlay, display-font headline);
`PageHeader` / `EmptyState` / `LoadingSpinner` gained `surface` prop; search
results and category filter restyled; `grep v18- components/storefront/` is clean.

`13` — gate green. One `<h1>` per page via `PageHeader as`; ink focus rings on
`.store-surface`, v18-primary on admin; global `prefers-reduced-motion`; filter
sheet title + `aria-pressed`; `LiveRegion` + toast announcements; `tests/a11y.spec.ts`
added (wired in 28a). Supabase migrations still manual — PDPs error until applied.

`14` — gate green. Deleted admin re-exports (`AdminShell`, `AdminSidebar`,
`AdminTopNav`, `PageHeader`), font-preview scratch scripts, orphaned
`ProductDetailClient` / `ProductImageGallery`; dropped `next-themes`,
`framer-motion`, `@eslint/eslintrc`; admin pages import shared `PageHeader`
with `surface="admin"`; added `knip` + `eslint-plugin-unused-imports`.
`/` First Load JS unchanged: 109 kB (shared 87.4 kB).

`15` — gate green. Cached `getSiteSettings` via public client + `unstable_cache`;
settings read moved to storefront/admin layouts; monochrome scoped to `.monochrome`
wrapper + `MonochromeProvider` per layout; `revalidateTag("settings")` on PATCH.
Category filters client-side (`FilteredProductGrid`); `generateStaticParams` on
product/category routes. Build: `/` static (○), `/product/[slug]` and
`/category/[...slug]` SSG (●, 140 pages). Reviews cached via public client;
missing table returns [] so prerender succeeds until migrations run.

`16` — gate green. `React.cache` on category reads; category page hoists one
`getAllCategories(true)` + in-memory breadcrumb/descendants; home page uses one
cached categories fetch (N+1 loop removed); `getRelatedProducts` resolves tree in
memory then one product query with featured/created ordering. Removed
`getCategoryBreadcrumb`.

`17` — gate green. Added `006_search_and_indexes.sql` (catalogue indexes,
`search_vector`, `search_products` / `search_categories` RPCs with pg_trgm).
Storefront and admin search use RPC; Node post-filtering removed. `buildIlikeOrFilter`
kept in `hooks/useProducts.ts` with TODO(19). **Requires manual migration 006**
before search works against live DB.

`18a` — gate green. Appended `effective_price` + colour normalisation to `006`.
`getProductsByCategory` pushes filters/sort/pagination into SQL (`overlaps`,
`effective_price`, `.range`); search intersects `search_products` RPC with category
IDs. Category page paginates with crawlable `<Link href="?page=N">` and
"Showing 1–20 of N". **Re-run 006 append** if migration was applied before 18a.

`20` — gate green. Dynamic sitemap + robots.txt; product/category/search metadata;
branded OG images; `/products/:slug` → `/product/:slug` redirect.

`21` — gate green. JSON-LD builders (`Organization`, `WebSite` + SearchAction,
`Product`, `BreadcrumbList`, `ItemList`); wired on layout, PDP, and category pages.
Numeric prices; `aggregateRating` omitted when count is 0. **Phase 2 complete.**

`22a` — gate green. Commerce core migration (`008_commerce_core.sql`): carts,
cart_items, addresses, orders, order_items + RLS; `in_stock` now generated from
`stock_count`; admin product form uses stock count only.

`22b` — gate green. Commerce support migration (`009_commerce_support.sql`):
payments, inventory_moves, coupons, shipments; `decrement_stock` / `restock` with
`for update` locking; `redeem_coupon`; admin-only RLS on all four tables.

`27b` — gate green. Migration `012_order_events.sql` (`order_events` audit trail +
`get_sales_metrics` RPC); admin order list/detail with filters; server-side status
machine, shipments, Razorpay refunds + `restock()`; dashboard shows revenue/AOV/top
products/low stock; Orders nav under Sales. Email hooks stubbed for 27c.
**Requires manual migration 012** before order events and sales metrics work live.

`27c` — gate green. Resend transactional email (`013_email_log.sql`), React Email
templates, webhook + contact receipts, failed-email admin with resend, Vercel Cron
for review requests (`vercel.json` + `CRON_SECRET`), verified-purchase RLS reviews
(auto-approve + badge), moderation queue at `/admin/dashboard/reviews`.
**Requires manual migration 013** and `RESEND_API_KEY` / `ORDER_FROM_EMAIL`.

`28a` — gate green. Vitest unit tests for all `lib/utils/` helpers, `buildTree`,
commerce maths, storage paths, and Zod product parsing (`lib/schemas/product.ts`);
cycle guard in `getGenderCategory`; Playwright E2E on port 3100 (`test:e2e`) with
smoke, admin, checkout guards, pagination, and wired `a11y.spec.ts`; deterministic
`supabase/seed.sql` fixture catalogue; `types/database.ts` baseline + `gen:types`
script. Seed-dependent E2E specs skip when migrations/seed are not applied.
Supabase clients stay untyped until a full `gen:types` run — partial Database type
breaks inserts/RPCs.

## Deferred

| Issue | Which prompt should own it |
|---|---|
| The home page hero headline is still white on off-white, so it is invisible. Prompt 12c names this exact line (`Hero.tsx:32`, `v18-text-on-gradient`) and owns the fix. Left alone deliberately rather than half-fixing a file 12c rewrites. | 12c-remaining-storefront-surfaces |
| `PageHeader` still renders v18 colours and always emits an `<h1>`, so the home page has four. Only the visibility was fixed here. | 12c-remaining-storefront-surfaces, then 13-accessibility |
| Admin login does not redirect to the dashboard on success — the session is created and the dashboard is reachable, but the form stays put. Pre-existing, unrelated to this prompt, and noticed only because I signed in to test the drawer. | flagged; no prompt owns it — worth a look during 27a |
| Supabase **public signup is still enabled** — I created a working account against the live project with nothing but the anon-side admin API. Already on the list for prompt 01, restating because I have now confirmed it rather than assumed it. | flagged for Arif |
| `BrandMark.tsx` asks for `font-extrabold` at `tracking-[0.18em]`, but Cormorant is loaded at 300/400/500 only, so the wordmark renders synthetically bolded. The token now at least points at a brand family instead of nothing; the right fix is to restyle the mark. | 08-navbar-rebuild |
| The storefront still renders the admin shell — the home page has a sidebar toggle, a notification bell and a public `/admin` link, and `BrandMark` is not mounted at all. Expected at this stage; tokens exist now but nothing consumes them. | 07-storefront-shell-swap |
| `NEXT_PUBLIC_SITE_URL` is set to `http://localhost:3000` locally. Production needs the real origin in Vercel or every canonical and Open Graph URL will point at localhost. | flagged for Arif; see "Blocked on Arif" |
| `npm audit` reports 7 high-severity advisories, all pre-existing and transitive (`next`/`postcss`, and `brace-expansion`/`glob`/`js-yaml` under the ESLint tooling). Vitest added none. Not touched here because upgrading Next mid-run would invalidate every version assumption in the plan. | 28b-ci-and-monitoring |
| `app/(storefront)/error.tsx` uses `v18-card` / `v18-text-heading` / `v18-text-muted`. That violates the storefront design rule outright. Left as-is because the storefront tokens it should use do not exist yet — 06 creates them. | 06-storefront-tokens / 07-storefront-shell-swap |
| Storefront errors reach the browser as HTTP 200 because Next 14 has already flushed the stream. Any uptime check that only reads status codes will miss a total database failure. | 28b-ci-and-monitoring |
| The home page renders its catalogue but shows "No products found." in the featured section — no row in the restored database has `is_featured = true`. Data, not code, but the empty state is worth a second look once real data is back. | 10-product-card |
| Action failure messages are generic ("Could not update the product") because `createProduct` / `updateProduct` swallow the Postgres error and return `null`. The authorisation path does return specific messages. | 04-error-handling, which owns `lib/queries/` |
| ~~`components/storefront/ProductReviews.tsx` is a storefront component still using `v18-*` classes~~ Restyled in 12a. `StarRating.tsx` still uses `v18-warning` / `v18-border` for star fill — out of 12a scope; 12c or 13 may own it. | 12a-pdp-layout |
| No admin UI for the moderation queue — reviews can only be approved with SQL. Nothing in the plan appears to add one. | flagged for Arif; 27b-admin-orders is the closest owner |
| Every route builds as dynamic (`ƒ`), including `/`. Expected at this stage. | 15-restore-isr |
| Pre-existing uncommitted work was in the tree at the start of this run — `RemoteImage.tsx`, `ImageUploader.tsx`, `ProductTable.tsx`, `next.config.mjs`, `lib/storage/images.ts` and five storefront components. Committed untouched as its own commit so later diffs stay honest. It looks like partial image-optimisation work. | 11-image-optimisation |
