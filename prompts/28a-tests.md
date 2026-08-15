# 28a — Tests

**Scope:** `package.json`, `tests/`, `supabase/seed.sql`, `types/database.ts`.

## Context

The repo has **no tests**. `package.json:5-10` defines `dev`, `build`, `start`,
`lint` (plus `typecheck` from prompt 01 and `test` from prompt 05).

`tsconfig.json` is `strict: true`, but the codebase routes around it —
`mapProduct` (`lib/queries/products.ts:31-42`) does `row as unknown as Product`,
which disables checking on the single most important type in the application. A
schema drift produces `undefined` fields silently.

Prompt 13 wrote `tests/a11y.spec.ts` but could not wire it; prompt 24b added
`/cart` to its route list.

## Task

### Scripts

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"gen:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > types/database.ts"
```

### Unit tests (Vitest)

Cover the pure logic that already exists and is trivially testable. Target 100%
on everything under `lib/utils/`:

- `slugify.ts` — unicode, punctuation, leading/trailing dashes, empty input
- `searchText.ts` — the injection cases from prompt 05, unicode tokens
- `formatPrice.ts` — INR formatting, zero, decimals, large values
- `getGenderCategory.ts` — ancestry walk, orphaned category, **cycle safety**
  (`findLevel1Category` at line 24 loops on a parent cycle — add a guard and a
  test for it)
- `formatDescription.ts` — paragraph splitting, whitespace-only input
- `storage/images.ts` — `normalizeStoragePath` and `getPublicUrl` against
  bucket-prefixed paths, full public URLs, query strings, and empty input
- `queries/categories.ts` `buildTree` — orphans, deep nesting, sort order
- Cart and order maths from 24a/25 — coupon application, tax rounding,
  free-shipping threshold boundary, paise conversion (`Math.round`)

### Runtime type safety

Replace `row as unknown as Product`:

- Generate database types with `npm run gen:types` into `types/database.ts`.
- Add a zod schema per table in `lib/schemas/` and parse query results at the
  boundary in `mapProduct` and its equivalents. A schema drift then fails
  loudly at the first request instead of producing `undefined` deep in a
  component.
- Type the Supabase clients with `createClient<Database>(...)`.

### E2E (Playwright)

Install Playwright and `@axe-core/playwright`. Wire up `tests/a11y.spec.ts`
from prompt 13.

`supabase/seed.sql` — a deterministic fixture catalogue: 4 categories across 3
levels, 12 products, 3 with variants, 2 on sale, 1 out of stock, 1 inactive.

Specs:

- **Smoke journey**: home → category → filter by size → PDP → select size →
  add to cart → cart → checkout → Razorpay test payment → order confirmation.
- Guest checkout without an account.
- Out-of-stock product blocks add-to-cart.
- Admin login → create product → verify it appears on the storefront.
- Category filter and pagination preserve state in the URL.

Run against `next build && next start` with the seeded database, not `next dev`.

## Acceptance

- `npm run test` and `npm run test:e2e` both pass from a clean checkout.
- Every function under `lib/utils/` has coverage.
- Removing a column from a Supabase table makes a test fail with a clear
  message, not a silent `undefined`.
