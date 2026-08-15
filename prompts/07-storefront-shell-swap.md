# 07 — Get the admin dashboard shell off the storefront

**Scope:** `app/(storefront)/layout.tsx`, `components/shared/V18Shell.tsx`,
`components/shared/V18Sidebar.tsx`, `components/shared/V18TopNav.tsx`,
`hooks/useUiStore.ts`, `app/admin/(cms)/layout.tsx`.

> Replace `.cursor/rules/` with the two files in `prompts/.cursor/rules/` before
> running this. The current rule tells you to use `V18Shell` on the storefront.

## Context

`app/(storefront)/layout.tsx:8` wraps the entire public store in `V18Shell`,
the **admin dashboard chrome**. Every shopper currently sees:

- a fixed 240px blue-gradient sidebar (`V18Sidebar.tsx:35`)
- a page breadcrumb string in the header (`V18TopNav.tsx:52`)
- a non-functional notification bell (`V18TopNav.tsx:61-67`)
- a hardcoded "A" avatar (`V18TopNav.tsx:76-82`)
- a public link to `/admin/dashboard` (`V18TopNav.tsx:68-75`)
- a blue gradient page background with product cards floating on it

It is also **broken on mobile**: `V18Shell.tsx:41` applies
`sidebarOpen ? "ml-60" : "ml-16"` and `V18Sidebar.tsx:35` applies
`fixed left-0 w-60` with **no `sm:`/`md:`/`lg:` prefix and no drawer**.
`useUiStore.ts:15` defaults `sidebarOpen: true`. On a 375px phone the sidebar
eats 240px and content is squeezed to ~135px.

Meanwhile `components/storefront/Navbar.tsx` and `Footer.tsx` — the correct
chrome — exist but are **imported nowhere**. The site has no footer at all.

## Task

**`app/(storefront)/layout.tsx`** becomes:

```tsx
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";

export default function StorefrontLayout({ children }) {
  return (
    <div className="store-surface flex min-h-screen flex-col">
      <Navbar />
      <main id="content" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

Add a skip-to-content link (`<a href="#content" className="sr-only focus:not-sr-only …">`)
as the first element.

Prompts 08 and 09a rebuild `Navbar` and `Footer`. In this prompt, just wire the
existing ones so the page renders — accept that they look wrong until then.

**Also restyle the four route-level files** off v18 while you are here, since
no later prompt touches them and they will otherwise render white-on-white once
the blue gradient is gone: `app/(storefront)/error.tsx` (lines 19-21),
`loading.tsx` (6, 9), `not-found.tsx` (9-10), and the `v18-text-*-on-gradient`
usages in `category/[...slug]/page.tsx` (102) and `search/page.tsx` (61, 91).
Swap `v18-card` → `store-hairline`, `v18-text-heading` → `text-store-ink`,
`v18-text-muted` → `text-store-ink-muted`, and any `*-on-gradient` → the plain
ink equivalents.

**Keep `V18Shell` for admin only.** Confirm `app/admin/(cms)/layout.tsx` uses
it with `variant="admin"` and remove the `variant="storefront"` branch, the
`showAdminLink` prop, and the storefront nav items from `V18Shell`,
`V18Sidebar`, and `V18TopNav`. Delete `STOREFRONT_NAV_ITEMS` from
`constants/index.ts` and the storefront `StorefrontSearch` import in
`V18TopNav`.

**Fix the admin sidebar on mobile while you're in there:** below `lg`, render
it as a shadcn `Sheet` drawer and drop the `ml-60`/`ml-16` offset (use
`lg:ml-60` / `lg:ml-16`). Default `sidebarOpen` to `false` and set it from a
`lg` media query on mount.

## Acceptance

- No sidebar, bell, avatar, breadcrumb, or "Admin" link on any storefront page.
- Storefront renders full-width at 375px with no horizontal scroll.
- Admin still works; its sidebar is a drawer on mobile.
- Grep for `v18-` under `app/(storefront)/` returns **nothing**. (Components
  under `components/storefront/` still contain v18 classes — prompts 08–12c
  clear those.)
