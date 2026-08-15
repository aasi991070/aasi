# 10 — Rebuild ProductCard and ProductGrid

**Scope:** `components/storefront/ProductCard.tsx`, `ProductGrid.tsx`,
`HomePageClient.tsx`.

## Context

`ProductCard.tsx` has four problems:

1. **It is a client component using Framer Motion for a 3% hover scale.**
   Lines 4, 21–30 import `framer-motion` and wrap the card in `motion.article`
   + `motion.div` with `whileHover` variants. In a grid of 20+ cards that ships
   the whole animation library to do what `transition-transform
   group-hover:scale-[1.03]` does in CSS for free.
2. **The "Add to Cart" button does nothing.** Lines 64–69 are a bare
   `<button type="button">` with a `className` and no `onClick`.
3. **That button is `opacity-0 group-hover:opacity-100`** (line 63) — invisible
   and unreachable on touch devices, yet still keyboard-focusable while
   invisible. That is a WCAG 2.4.7 and 2.4.11 failure.
4. It uses `v18-card` (shadow, 20px radius) and `v18-btn-primary` — admin
   styling on a luxury storefront.

`ProductGrid.tsx:23` is `grid-cols-2 lg:grid-cols-4` with `gap-6` — the design
rule requires a minimum 32px (`gap-8`) grid gap.

`HomePageClient.tsx` is `"use client"` for no reason — it has no state, no
handlers, and no browser APIs. It only exists to pass props through.

## Task

**`ProductCard`** — make it a **server component**:

- Remove `"use client"` and the `framer-motion` import entirely.
- No border at rest; hairline `--color-store-border` appears on hover (per the
  design rule). No shadow. No `v18-*` class.
- Image: `aspect-[3/4]`, `object-cover`, CSS `group-hover:scale-[1.03]` with a
  400ms ease-out transition, wrapped in `overflow-hidden`. Guard with
  `motion-reduce:transform-none motion-reduce:transition-none`.
- Name in sans; price below in sans weight 500. Sale price in
  `--color-store-accent` with the original struck through in muted.
- Extract the Add-to-Cart button into a separate client component
  `components/storefront/AddToCartButton.tsx` so the card itself stays on the
  server. In this prompt it renders disabled with a `// TODO(24b)` comment —
  prompt 24b wires the real action.
- The button must be **visible by default below `lg`** and use
  `lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100`.
  Never focusable while invisible — pair the opacity with `invisible`/`visible`
  so it leaves the tab order when hidden.
- Add a "Sale" / "Sold out" badge derived from `sale_price` and `in_stock`.

**`ProductGrid`** — `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8`. Keep the
empty state but restyle it (no `v18-card`). Accept an optional `priority`
count so the first row's images can set `priority`.

**`HomePageClient`** — delete `"use client"` and rename it to a server
component, or inline it into `app/(storefront)/page.tsx`. `GenderToggle` stays
a client component and is imported directly.

## Acceptance

- `framer-motion` no longer appears in any file under `components/storefront/`.
- `ProductCard` has no `"use client"` directive.
- Tabbing through a product grid on desktop never focuses an invisible button.
- Add-to-Cart is visible without hover on a 375px viewport.
