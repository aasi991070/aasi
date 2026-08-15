# 16 — Kill the N+1s and duplicate fetches

**Scope:** `lib/queries/categories.ts`, `lib/queries/products.ts`,
`app/(storefront)/page.tsx`, `app/(storefront)/category/[...slug]/page.tsx`.

## Context

Three measurable waste patterns:

**1. `getAllCategories` runs three times per category page render.**
`category/[...slug]/page.tsx` calls it inside `resolveCategoryFromSlugs`
(line 21), again directly at line 73, and a third time inside
`getCategoryBreadcrumb` (`categories.ts:159`). Three identical round trips for
the same table, nothing memoised.

**2. N+1 on the home page.** `app/(storefront)/page.tsx:23-28`:

```ts
const categoryCards = await Promise.all(
  level1Categories.map(async (l1) => {
    const children = await getChildCategories(l1.id, true);   // one query each
    return { l1, children: children.slice(0, 3) };
  })
);
```

**3. `getRelatedProducts` makes up to five sequential round trips.**
`lib/queries/products.ts:241-295` walks the tree one `maybeSingle()` at a time:
the product's category, its parent, possibly its grandparent, then the sibling
categories, then the products.

## Task

**Memoise per request.** Wrap the read-only category functions in
`React.cache()`:

```ts
export const getAllCategories = cache(async (activeOnly = false) => { … });
```

Apply to `getAllCategories`, `getCategoryTree`, `getCategoryBySlug`,
`getCategoryById`. `cache` keys on arguments, so keep the `activeOnly` flag
rather than adding a second uncached variant. These already sit on
`unstable_cache` + `createPublicClient()` from prompt 03 — `React.cache` is the
per-request layer on top.

**Home page** — replace the loop with one query. On a self-referencing FK the
embed direction is ambiguous, so name the constraint explicitly and **keep the
child filter**, which the current `getChildCategories(l1.id, true)` provides:

```ts
supabase
  .from("categories")
  .select("*, children:categories!categories_parent_id_fkey(*)")
  .eq("level", 1)
  .eq("is_active", true)
  .eq("children.is_active", true)
  .order("sort_order");
```

Verify the constraint name against migration `000_baseline.sql` and correct it
if it differs. Apply the `.slice(0, 3)` in memory, as the current code does —
`limit` on an embedded resource applies per parent in PostgREST and is easy to
get wrong here.

**`getRelatedProducts`** — rewrite to resolve the level-3 ancestor **in memory**
from the already-cached `getAllCategories()` result: zero extra round trips,
then exactly one product query. While you are there, add
`.order("is_featured", { ascending: false }).order("created_at", { ascending: false })`
so related products are deterministic rather than arbitrary.

**Category page** — hoist a single `const allCategories = await getAllCategories(true)`
and pass it into `resolveCategoryFromSlugs`, `getDescendantIds`, and an
in-memory breadcrumb. The breadcrumb logic already exists as
`getCategoryBreadcrumbPath` in `lib/utils/getGenderCategory.ts:33` — reuse it
and delete the DB-hitting `getCategoryBreadcrumb` from `categories.ts:156`.
`product/[slug]/page.tsx:45` also calls it — update that too.

## Verify

Add a temporary `console.count("categories-query")` in the query layer and load
a category page. Count must drop from 3+ to 1. Remove the counter before
committing.

## Acceptance

- One `categories` query per request, not three.
- Home page issues a fixed number of queries regardless of category count, and
  still shows only **active** children.
- `getRelatedProducts` issues exactly one query.
- No user-visible behaviour change. Compare a category page and a PDP
  before/after, screenshot-diff if convenient.
