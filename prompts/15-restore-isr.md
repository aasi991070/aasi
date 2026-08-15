# 15 — Restore ISR (every page is currently dynamic)

**Scope:** `app/layout.tsx`, `app/(storefront)/layout.tsx`,
`lib/queries/settings.ts`, `app/globals.css`, `app/api/settings/route.ts`,
`app/(storefront)/category/[...slug]/page.tsx`, `CategoryFilter.tsx`.

## Context

`app/layout.tsx:34` awaits `getSiteSettings()`. That calls
`lib/queries/settings.ts:95` → `lib/supabase/server.ts:5` → `cookies()`.

Reading cookies in the **root layout** opts the entire route tree — storefront
included — into dynamic rendering. Therefore `export const revalidate = 3600`
at `(storefront)/page.tsx:13`, `product/[slug]/page.tsx:16`, and
`category/[...slug]/page.tsx:18` produces **no static or ISR output at all**.
The settings function is even named `fetchSiteSettingsUncached`
(`settings.ts:93`) and runs on every render of every page.

There is also no `generateStaticParams` anywhere in the repo.

Prompts 03, 08, and 09a already moved the catalogue and nav queries onto
`createPublicClient()`; settings is the last cookie-reader in the storefront path.

## Task

### 1. Cache site settings and get cookies out of the root layout

`fetchSiteSettingsUncached` must use `createPublicClient()` from
`lib/supabase/public.ts` (created in prompt 03), **not** `lib/supabase/server.ts`.
Then:

```ts
export const getSiteSettings = unstable_cache(
  fetchSiteSettingsUncached,
  ["site-settings"],
  { tags: ["settings"], revalidate: 3600 }
);
```

Move the `getSiteSettings()` call out of `app/layout.tsx` and into
`app/(storefront)/layout.tsx`. The root layout keeps only fonts, metadata, and
`Providers`, and becomes synchronous.

### 2. Move the monochrome class without breaking its CSS

The root layout currently sets `className="monochrome"` and
`data-monochrome` on `<html>` (`app/layout.tsx:39-40`), and **every monochrome
rule is scoped to `html.monochrome`** (`globals.css:249`). If you move the class
to a wrapper `<div>` without touching the CSS, monochrome silently stops working.

Do both together:

- Change the `globals.css` selector from `html.monochrome` to
  `.monochrome` (a plain class selector works at any depth).
- Apply the class on the storefront layout's root `<div>` and, separately, on
  the admin layout's root — each side reads settings for itself.
- `<Providers initialMonochrome={…}>` is currently fed from the root layout
  (`app/layout.tsx:44`). Move `MonochromeProvider` out of `Providers` into the
  two layouts so each supplies its own value, or pass `initialMonochrome`
  through a context set by the layouts. Do not silently drop it.

### 3. Invalidate on write

`app/api/settings/route.ts` PATCH already calls `revalidatePath("/", "layout")`.
Add `revalidateTag("settings")`.

### 4. Add `generateStaticParams`

- `product/[slug]/page.tsx` — all active product slugs
- `category/[...slug]/page.tsx` — every slug path in the tree
- `export const dynamicParams = true` on both so new items still render.

### 5. Make the category page static

The category page awaits `searchParams` (line 69) for filters. **On Next 14
stable, reading `searchParams` in a page opts the whole route into dynamic
rendering — wrapping the consumer in `<Suspense>` does not help.** Partial
prerendering is canary-only. So:

- Remove `searchParams` from the page entirely. The page renders the category
  shell and the **unfiltered** first page of products — fully static.
- Move filtering to the client: `CategoryFilter` already reads
  `useSearchParams` (`CategoryFilter.tsx:15`). Add a client
  `FilteredProductGrid` that reads the same params and calls a
  `getFilteredProducts` server action, seeded with the server-rendered first
  page so there is no empty flash.
- Keep the filter state in the URL so it stays shareable, and keep pagination
  as real `<Link href>` (prompt 18b) so it stays crawlable.

## Verify

`npm run build` and read the route table. `/`, `/product/[slug]`, and
`/category/[...slug]` must show `●` (SSG) or `ISR`, **not** `ƒ` (Dynamic).

## Acceptance

- Build output shows prerendered storefront routes.
- Home page issues zero Supabase queries on a warm cache.
- Toggling monochrome in the admin still greys the whole UI.
- Changing hero settings updates the storefront within one request.
