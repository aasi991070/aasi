# 12a — Product page: structure and styling

**Scope:** `app/(storefront)/product/[slug]/page.tsx`,
`components/storefront/ProductDetailClient.tsx` (split up),
`CategoryBreadcrumb.tsx`, `ProductReviews.tsx`.

Selectors and gallery are prompt 12b. Do not touch them here beyond passing props.

## Context

The PDP is the highest-value page on the site and is currently a white
dashboard card that, after prompt 07, sits on a white page.

- `ProductDetailClient.tsx` is one large `"use client"` component holding the
  **entire page**, including wholly static content. Only selection state needs
  to be interactive.
- `PageHeader` (line 52) emits an `<h1>` styled `v18-text-on-gradient` — white
  text, now on white.
- Add to Cart (lines 117–122) is a bare `<button type="button">` with no `onClick`.
- No quantity selector, no stock messaging, no delivery estimate, no size-guide
  link, no share, no wishlist.
- Everything uses `v18-card` / `v18-text-*`.

## Task

**Split the client component.** After this prompt the tree should be:

```
page.tsx                    server — data fetching (unchanged)
├─ ProductGallery           client (12b)
├─ ProductInfo              server — breadcrumb, h1, price, description accordion
│   └─ ProductPurchasePanel client — colour/size/qty state + AddToCartButton
├─ ProductReviews           client (existing, restyled)
└─ ProductGrid "You May Also Like"   server
```

Delete `ProductDetailClient.tsx` once its contents are distributed.

**Layout** — two columns on `lg`, stacked below. Left: gallery. Right:
breadcrumb → product name as the page's **single `<h1>`** in the display font →
price (sale price in accent, original struck through) → colour selector → size
selector with a "Size guide" link → quantity stepper → Add to Cart → stock
message → accordion for Description, Fabric & Care, Shipping & Returns.

Storefront tokens only. Hairline separators, no cards, no shadows.

**Add to Cart** — reuse `AddToCartButton` from prompt 10. It stays disabled with
a visible reason ("Select a size") until a size is chosen when the product has
sizes. Keep the `// TODO(24b)` — prompt 24b wires the action.

**Mobile** — sticky bottom bar with price + Add to Cart once the main button
scrolls out of view. Respect `env(safe-area-inset-bottom)`.

**Reviews** — restyle `ProductReviews` to storefront tokens. Add a rating
distribution bar chart, a sort control (newest / highest / lowest), and
pagination past 10. Keep the moderation copy from prompt 02.

**Description** — `splitDescriptionParagraphs` already exists
(`lib/utils/formatDescription.ts`); keep using it.

## Acceptance

- Exactly one `<h1>` on the page.
- `ProductInfo` and the related-products grid have no `"use client"` directive.
- No `v18-*` class in any file touched.
- Sticky mobile bar appears and does not overlap the footer.
