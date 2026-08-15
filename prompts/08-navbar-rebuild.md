# 08 — Rebuild the storefront header

**Scope:** `components/storefront/Navbar.tsx`, `BrandMark.tsx`,
`StorefrontSearch.tsx`, new `components/storefront/CategoryNav.tsx`.
Delete `components/storefront/SearchBar.tsx`.

## Context

`Navbar.tsx` exists but is imported nowhere and its classes
(`bg-store-white`, `text-store-ink` at lines 28, 39, 54, 62, 68) only started
resolving after prompt 06. Its nav links are **hardcoded** to
`/category/mens`, `/category/womens`, `/category/mens/clothing`,
`/category/mens/footwear` — they ignore the real category tree, so anything the
admin adds is invisible.

`SearchBar.tsx` is a 6-line pass-through to `StorefrontSearch` with one caller.

There is no cart, no wishlist, no account entry point anywhere in the header.

## Task

Rebuild `Navbar` as a **server component** that fetches the category tree
(levels 1 and 2) and renders:

> **Use the cached, cookie-free path.** `Navbar` sits in the storefront layout,
> so if it calls a query built on `lib/supabase/server.ts` it re-introduces
> `cookies()` into every storefront route and makes prompt 15's ISR work
> impossible. Call the `unstable_cache`-wrapped `getCategoryTree(true)` that
> prompt 03 converted to `createPublicClient()`. Same applies to `Footer` in
> prompt 09a.


- **Left:** `BrandMark` (Cormorant Garamond wordmark, per the design rule).
- **Centre:** `CategoryNav` — a client component. Desktop: level-1 items as
  uppercase links, tracking-widest, `text-xs`; hovering or focusing one opens a
  panel listing its level-2 children in columns. Mobile: a full-screen menu
  opened by a text "Menu" link (per the spec — no hamburger icon), with
  level-1 items expanding to reveal children.
- **Right:** search (`StorefrontSearch`), wishlist icon, **cart icon with an
  item-count badge**, account icon.

Behaviour:

- Sticky. Transparent at scroll top, `--color-store-white` with a hairline
  bottom border once scrolled past 20px. Keep the existing scroll listener
  pattern from `Navbar.tsx:12-16` but move it into `CategoryNav` or a small
  `useScrolled` hook so `Navbar` itself stays on the server.
- The cart badge is a placeholder in this prompt — render a `CartButton`
  component with a hardcoded `0` and a `// TODO(24b)` comment. Prompt 24b wires it.
- Full keyboard support: the mega-nav opens on focus, `Escape` closes it, focus
  is trapped inside the mobile menu, and the trigger is `aria-expanded`.
- Lock body scroll while the mobile menu is open.

Restyle `StorefrontSearch` to storefront tokens (it currently uses
`text-v18-muted` and `--radius-v18-input`). Keep it inside `<Suspense>` — it
reads `useSearchParams`.

Update `BrandMark.tsx` to use `font-display` instead of the undefined
`font-logo`.

Delete `SearchBar.tsx` and update its one importer.

## Acceptance

- Adding a level-2 category in the admin makes it appear in the header nav.
- No `v18-*` class remains in any file touched.
- Mega-nav is fully operable by keyboard alone.
- Lighthouse mobile a11y on `/` has no navigation violations.
