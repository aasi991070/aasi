# 19 — One query layer (the data layer is written twice)

**Scope:** `hooks/useProducts.ts`, `hooks/useCategories.ts`,
`lib/actions/catalog.ts`, `app/admin/(cms)/dashboard/products/page.tsx`,
`.../categories/page.tsx`, `ProductTable.tsx`, `CategoryTreeView.tsx`.

## Context

Product and category logic exists in two places with **divergent behaviour**:

| Concern | Server | Client |
|---|---|---|
| Product list | `lib/queries/products.ts:44` `getProducts` | `hooks/useProducts.ts:7` `fetchProducts` |
| Post-fetch token filter | yes (lines 85-91) | **no** |
| `isActive` / `isFeatured` filters | yes | **no** |
| Category tree build | `categories.ts:7` `buildTree` | reimplemented `useCategories.ts:16-28` |
| Root detection | `!parent_id \|\| level === 1` | unconditional `else` — **orphans also become roots** |

So the admin list and the storefront disagree about what matches a search, and
the two tree builders disagree about orphaned categories.

The client hooks also `.insert()`, `.update()`, and `.delete()` directly from
the browser on the anon key (`useProducts.ts:60, 84, 102`;
`useCategories.ts:43, 67, 86`). These still *work* — the browser client carries
the admin's JWT, so `is_admin()` from prompt 01 passes — but they are now
redundant with the server actions from prompt 03 and they keep write capability
in the browser, which is the thing prompt 01 set out to remove.

> Both admin list pages are `"use client"` today —
> `app/admin/(cms)/dashboard/products/page.tsx:1` (drives the list with
> `useProducts` / `useDeleteProduct` / `useState`) and `.../categories/page.tsx:1`
> (`useCategoryTree`). They need converting to server components, not just a
> call swap.

## Task

**Delete every mutation hook:** `useCreateProduct`, `useUpdateProduct`,
`useDeleteProduct`, `useCreateCategory`, `useUpdateCategory`,
`useDeleteCategory`, `useReorderCategories`.

Move consumers to `lib/actions/catalog.ts`, called via `useTransition` (React 18
— `useActionState` does not exist; use `useFormState` from `react-dom` if you
want form state).

Prompt 03 already converted `ProductForm` and `CategoryForm`. This prompt
converts the two remaining consumers, `ProductTable` and `CategoryTreeView`.

**Add `reorderCategoriesAction`.** The current implementation
(`categories.ts:240-257`) fires N parallel un-transacted updates and returns
`true` regardless of failure. Replace it with one Postgres RPC taking a
`jsonb` array of `{id, sort_order}` and updating all rows in a single
transaction. Surface real failures — `CategoryTreeView.tsx:188-190` currently
toasts "Order updated" even when nothing was.

**Convert the two list pages to server components.** Fetch with `getProducts` /
`getCategoryTree` on the server and pass results down. `ProductTable` and
`CategoryTreeView` stay client components for their row actions and drag-and-drop,
receiving data as props. Pagination and search move to `searchParams` on the
server page (admin routes are dynamic anyway — that is fine here).

**Delete the duplicated tree builder** in `useCategories.ts`. Export `buildTree`
from `lib/queries/categories.ts` and use the one implementation, including its
`|| level === 1` root rule.

**Delete `buildIlikeOrFilter`** (prompt 05) now that prompt 17 replaced the
server-side callers and this prompt removes the last one.

After the deletions both hook files are empty — delete them.

Keep React Query only where the client genuinely owns the data: `useReviews` and
`useSiteSettings`.

## Guard against regression

Add an ESLint `no-restricted-imports` rule (or a CI grep) failing if
`@/lib/supabase/client` is imported by anything other than
`app/admin/login/login-client.tsx` and `lib/storage/images.ts`. The browser
client should only ever do auth and storage uploads — never table writes.

## Acceptance

- `grep -rn "\.insert(\|\.update(\|\.delete(" hooks/ components/` returns nothing.
- Admin CRUD works end to end for products and categories.
- Category reorder is atomic and reports real errors.
- One `buildTree` in the repo.
- Both admin list pages have no `"use client"` directive.
