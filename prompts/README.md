# Cursor Prompts — Aasi Storefront Remediation

37 small, self-contained prompts taking the site from "catalogue wearing an
admin dashboard's skin" to a working ecommerce storefront. Each is scoped to a
handful of files so Cursor keeps the whole task in context and you review a
small diff.

## Two ways to run this

**Autonomous (recommended).** Paste `00-START-HERE.md` into Cursor Composer in
agent mode, once. It sets up a `PROGRESS.md` ledger, works through 01 → 28b on
its own, commits per prompt, and only stops for the five things that genuinely
need you (destructive migrations, credentials, legal placeholders, a broken
premise, a plan conflict). It has explicit licence to improve on the prompts
where it can see better — and to record what it changed.

**Manual.** Run one prompt per composer session in the order below, reviewing
each diff. Slower, more control.

Either way, do the two setup steps first.

## Before you start

1. Commit or branch. Every prompt should be its own commit.
2. **Replace the Cursor rules first.** Copy both files from
   `prompts/.cursor/rules/` over `.cursor/rules/`:
   - `storefront-design-system.mdc` — new; the luxury-minimal system that was
     specified but never built.
   - `v18-design-system.mdc` — replaces the existing file, rescoped to admin only.

   This matters more than it looks. The current rule's line 36 says *"Use
   `V18Shell` … for both storefront and admin CMS routes"* and line 48 forbids
   the storefront gold/off-white tokens. That one rule is why the shop looks
   like a dashboard, and until it is replaced Cursor will keep undoing the
   storefront rebuild.
3. `cursor-master-prompt.md` stays as the design reference. Treat its
   *"already applied — do not recreate"* schema section as out of date: prompt
   01 puts the real schema under version control.

## How to run one

Open Cursor Composer in agent mode, paste the whole prompt file, let it work,
then:

```
npm run typecheck && npm run lint && npm run build
```

(`typecheck` is added by prompt 01.) Review the diff. Commit. Next.

## Order

| # | File | Main files touched |
|---|---|---|
| 00 | `00-START-HERE.md` | the autonomous driver — paste this, not the ones below |

### Phase 0 — Stabilise (01 and 02 are security; do not skip)

| # | File | Main files touched |
|---|---|---|
| 01 | `01-schema-baseline-rls.md` | `supabase/migrations/`, `package.json` |
| 02 | `02-lock-down-reviews.md` | reviews API, query layer, migration 004 |
| 03 | `03-fix-revalidate.md` | revalidate route, `lib/actions/`, `lib/supabase/public.ts`, both admin forms |
| 04 | `04-error-handling.md` | all of `lib/queries/`, error boundaries |
| 05 | `05-search-sanitise.md` | `searchText.ts`, 3 query builders, Vitest setup |

### Phase 1 — Storefront rebuild

| # | File | Main files touched |
|---|---|---|
| 06 | `06-storefront-tokens.md` | `globals.css`, `layout.tsx`, fonts |
| 07 | `07-storefront-shell-swap.md` | storefront + admin layouts, `V18*`, `useUiStore`, route-level files |
| 08 | `08-navbar-rebuild.md` | `Navbar`, `CategoryNav`, `BrandMark`, search |
| 09a | `09a-footer.md` | `Footer`, `constants`, migration 005 |
| 09b | `09b-static-pages.md` | 9 new routes, `ProseLayout`, contact action |
| 10 | `10-product-card.md` | `ProductCard`, `ProductGrid`, `AddToCartButton` |
| 11 | `11-image-optimisation.md` | `RemoteImage`, `next.config.mjs`, `ImageUploader` |
| 12a | `12a-pdp-layout.md` | PDP split into server + client parts, reviews |
| 12b | `12b-pdp-gallery-and-selectors.md` | gallery, `SizeSelector`, `ColorSelector` |
| 12c | `12c-remaining-storefront-surfaces.md` | `Hero`, search page, shared components |
| 13 | `13-accessibility.md` | headings, focus, motion, live region, axe spec |
| 14 | `14-dead-code.md` | deletions, `knip`, drop `next-themes` |

### Phase 2 — Performance & SEO

| # | File | Main files touched |
|---|---|---|
| 15 | `15-restore-isr.md` | root layout, settings caching, `generateStaticParams`, monochrome CSS |
| 16 | `16-query-dedupe.md` | `React.cache`, home N+1, related products |
| 17 | `17-indexes-and-fts.md` | migration 006, `search.ts` |
| 18a | `18a-category-query-and-pagination.md` | `getProductsByCategory`, `effective_price` |
| 18b | `18b-filter-ui-and-facets.md` | facets RPC, `CategoryFilter`, sort, chips |
| 19 | `19-single-query-layer.md` | delete both hook files, convert admin pages |
| 20 | `20-sitemap-robots.md` | `sitemap.ts`, `robots.ts`, OG images, redirects |
| 21 | `21-structured-data.md` | JSON-LD builders, canonicals |

### Phase 3 — Commerce

| # | File | Main files touched |
|---|---|---|
| 22a | `22a-commerce-schema-core.md` | migration 007, stock fix, `types` |
| 22b | `22b-commerce-schema-support.md` | migration 008, `decrement_stock` |
| 23 | `23-variants-admin.md` | `VariantMatrix`, `ProductForm`, migration 009 |
| 24a | `24a-cart-actions.md` | `middleware.ts`, cart actions and queries |
| 24b | `24b-cart-ui.md` | drawer, cart page, `AddToCartButton` wiring |
| 25 | `25-checkout.md` | checkout route, `createOrderAction`, migration 010 |
| 26 | `26-razorpay.md` | payment action, webhook, order status page |
| 27a | `27a-customer-accounts.md` | `/account`, middleware, guest lookup |
| 27b | `27b-admin-orders.md` | admin orders, status machine, migration 011, metrics |
| 27c | `27c-email-and-verified-reviews.md` | Resend, migration 012, verified reviews |

### Phase 4

| # | File | Main files touched |
|---|---|---|
| 28a | `28a-tests.md` | Vitest, Playwright, seed, generated DB types |
| 28b | `28b-ci-and-monitoring.md` | GitHub Actions, Lighthouse CI, Sentry, husky |

## Migration numbering

Reserved up front so prompts do not collide. Prompt 01 records this in
`supabase/migrations/README.md`:

```
000 baseline schema          01        007 commerce core     22a
001 site settings            (exists)  008 commerce support  22b
002 product reviews          (exists)  009 product SEO       23
003 admin RLS                01        010 shipping rates    25
004 review moderation        02        011 order events      27b
005 site content             09a       012 email log         27c
006 search + indexes         17 (18a and 18b append to it)
```

## Standing rules

Paste this at the top of any session if Cursor starts drifting:

> Do not refactor files outside the scope listed. Do not "improve" unrelated
> code. Keep `npm run typecheck` clean. No `any`, no `as unknown as`. No new
> dependencies unless the prompt names them. Server components by default —
> `'use client'` only for event handlers, hooks, and browser APIs.
> **React is 18.3, not 19**: no `useOptimistic`, no `useActionState`, no `use()`.
> **Next is 14.2, not 15**: `cookies()` in a layout makes the whole tree
> dynamic, and reading `searchParams` in a page makes that route dynamic —
> `<Suspense>` does not change either.
