# 06 — Add the storefront design tokens and fonts (they were never written)

**Scope:** `app/globals.css`, `app/layout.tsx`, `package.json`.

## Context

`cursor-master-prompt.md` §"Design Tokens" specifies two palettes: a
luxury-minimal storefront set (`--color-store-*`) and a blue admin set. Only
the admin set was ever written. `app/globals.css` defines `--color-v18-*`
exclusively — **no `--color-store-*` token exists anywhere in the codebase.**

As a result `components/storefront/Footer.tsx` (lines 6, 10, 17),
`Navbar.tsx` (line 39), and `BrandMark.tsx` (line 10) reference
`text-store-ink`, `text-store-ink-muted`, `bg-store-white`,
`border-store-border`, and `font-logo` — all of which resolve to nothing.
Those components would render completely unstyled.

The fonts are wrong too. The spec calls for Cormorant Garamond + DM Sans.
`app/layout.tsx:9-14` loads **Inter and Geist Sans** — two full families, and
`--font-geist-sans` is referenced only by an unused `.font-geist` utility.

## Task

**`app/globals.css`** — inside the existing `@theme` block, add alongside the
v18 tokens (do not remove any v18 token):

```css
/* Storefront — luxury minimal */
--color-store-ink:         #0f0f0f;
--color-store-ink-muted:   #6b6b6b;
--color-store-surface:     #fafaf8;
--color-store-white:       #ffffff;
--color-store-border:      #e8e6e1;
--color-store-accent:      #c8a96e;
--color-store-accent-dark: #9d7f48;
```

Add storefront utilities in `@layer utilities`:

- `.store-surface` — page background
- `.store-hairline` — `1px solid var(--color-store-border)`, no shadow
- `.store-btn` — accent-outlined CTA, fills to accent on hover, min-height 44px
- `.font-display` — `var(--font-display)`

Add a `@media (prefers-reduced-motion: reduce)` block that disables transforms
and transitions on `.store-*` utilities.

Delete the unused `.font-geist` utility.

**`app/layout.tsx`** — replace the font setup:

```ts
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
// Cormorant_Garamond: weights 300,400,500 → variable "--font-display"
// DM_Sans: weights 400,500 → variable "--font-sans"
// both: display: "swap", subsets: ["latin"]
```

Remove the `Inter` import and the `geist` import. Remove `"geist"` from
`package.json` dependencies.

Add `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")`
to the exported `metadata` — it is currently missing, which breaks every Open
Graph URL. Add `NEXT_PUBLIC_SITE_URL` to `.env.local`.

## Do not

- Do not change any component in this prompt. Tokens only.
- Do not touch the `html.monochrome` block.

## Acceptance

- `npm run build` succeeds; no Inter or Geist request in the network tab.
- `--color-store-accent` resolves in devtools on any page.
- Admin pages look identical to before.
