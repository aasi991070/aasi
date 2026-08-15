# 03 — Fix cache revalidation (it has never worked)

**Scope:** `app/api/revalidate/route.ts`, `components/admin/ProductForm.tsx`,
`components/admin/CategoryForm.tsx`, new `lib/actions/`.

## Context

Three separate bugs in one path:

1. `app/api/revalidate/route.ts:10` reads
   `if (expectedSecret && secret !== expectedSecret)`. When
   `REVALIDATE_SECRET` is unset the guard is **skipped entirely** — any
   unauthenticated POST can purge arbitrary paths. It fails open.
2. `ProductForm.tsx:128-132` and `CategoryForm.tsx:96-100` POST to that route
   **without** the `x-revalidate-secret` header. Since the secret *is* set,
   the route returns 401 — and the response is never checked, so it fails
   silently.
3. Those calls target `"/product"` and `"/category"`. The real routes are
   `/product/[slug]` and `/category/[...slug]`. `revalidatePath("/product")`
   matches nothing.

Net effect: **product and category pages have never been revalidated after an
admin edit.**

## Task

**Harden the route** — it should still exist for external triggers:

```ts
if (!expectedSecret || secret !== expectedSecret) {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
```

Fail closed. Also validate that `body.paths` is an array of strings and cap it
at 20 entries.

**Replace the client fetch with server actions.** Create `lib/actions/catalog.ts`
with `"use server"` and:

- `saveProductAction(input)` — create or update, then
  `revalidateTag('products')`, `revalidateTag(\`product:${slug}\`)`,
  `revalidatePath('/')`, and `revalidatePath('/category/[...slug]', 'page')`
- `deleteProductAction(id)` — same invalidation
- `saveCategoryAction(input)` / `deleteCategoryAction(id)` — invalidate
  `categories`, `/`, and the category route

Each action must re-check admin authorisation server-side (`supabase.auth.getUser()`
plus an `admin_users` lookup) before writing. Do not trust the client.

Update both forms to call the actions via `useTransition` instead of the
mutation hooks and the `/api/revalidate` fetch. Surface real error messages
from the action result through `useUiStore().showToast()` — not the current
generic "Failed to save product".

> React is pinned to `^18.3.1` (`package.json:27`). `useActionState` does not
> exist on React 18 — use `useTransition`, or `useFormState` from `react-dom`.

`ProductTable.tsx` and `CategoryTreeView.tsx` still use the delete/reorder
hooks; prompt 19 migrates them. Leave them alone here.

**Add a cookie-free Supabase client so caching is possible at all.** Create
`lib/supabase/public.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
```

This matters: `lib/supabase/server.ts:5` calls `cookies()`, and Next 14 throws
*"Route used `cookies` inside a function cached with `unstable_cache`"* if you
try to cache anything built on it. Public catalogue reads have no user context
and must use `createPublicClient()`.

**Add the tags.** Convert the read-only storefront queries in
`lib/queries/products.ts` and `categories.ts` to `createPublicClient()` and wrap
them in `unstable_cache` with the matching tag, so the invalidation above has
something to invalidate. Leave admin reads and anything needing the session on
`lib/supabase/server.ts`.

Prompt 15 extends this to `getSiteSettings`; do not touch that function here.

## Acceptance

- POST to `/api/revalidate` with no secret returns 401, with the env var set or unset.
- Editing a product in the admin and reloading its PDP shows the change without
  waiting for the 3600s window.
- Saving with an expired session shows a real "not authorised" message.
