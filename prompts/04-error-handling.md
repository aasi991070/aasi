# 04 — Stop swallowing database errors

**Scope:** `lib/queries/*.ts`, `app/(storefront)/error.tsx`,
`app/admin/(cms)/error.tsx`, new `lib/errors.ts`.

## Context

Every query in `lib/queries/` is wrapped in a bare
`catch { return [] }` / `return null` / `return false` / `return 0`.
Affected lines include `products.ts` 97, 114, 130, 148, 164, 181, 236, 292,
320, 343, 363, 374; `categories.ts` 49, 69, 93, 111, 127, 151, 204, 224, 235,
254, 268; `search.ts` 70, 130; `reviews.ts` 27. Treat those as a starting
point — grep `} catch {` under `lib/queries/` for the authoritative list.

Consequences:

- `getProductBySlug` returns `null` on a transient network error, so
  `app/(storefront)/product/[slug]/page.tsx:36` calls `notFound()` — **a live
  product serves HTTP 404 and gets deindexed by Google.**
- A Supabase outage renders an empty catalogue with HTTP 200 instead of an
  error page. Nobody gets paged.
- `createProduct` returning `null` is indistinguishable from a validation
  failure, which is why the admin can only say "Failed to save product".
- Nothing is logged anywhere. There is zero observability.

## Task

Create `lib/errors.ts`:

```ts
export class DataError extends Error {
  constructor(public op: string, public cause: unknown) { … }
}
export function assertOk<T>(
  op: string,
  res: { data: T; error: unknown | null }
): T
```

`assertOk` throws a `DataError` carrying the operation name and the Supabase
error, and logs it (`console.error` for now; prompt 28b wires Sentry).

Then rewrite every function in `lib/queries/`:

- **Delete the bare `try/catch` wrappers.** Errors propagate.
- Use `assertOk` on every Supabase response.
- Keep the `null` return **only** for genuine "not found" — i.e. `maybeSingle()`
  returning `data: null` with `error: null`. A `null` return must never mean
  "the query failed".
- `getSiteSettings` is the one deliberate exception: it may still fall back to
  defaults, but log the reason rather than silencing it.

Update both `error.tsx` boundaries to render a real error state (not the
current generic copy) and to log `error.digest`.

Add `app/global-error.tsx`.

## Do not

- Do not change any query's shape, filters, or return type beyond removing the
  error-swallowing.
- Do not add a logging dependency in this prompt.

## Acceptance

- Killing network access to Supabase produces an error page, not an empty
  catalogue and not a 404.
- `npm run typecheck` is clean.
- Grep for `} catch {` under `lib/queries/` returns nothing.
