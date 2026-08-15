# 12b — Product gallery and size/colour selectors

**Scope:** `components/storefront/ProductImageGallery.tsx`,
`SizeSelector.tsx`, `ColorSelector.tsx`.

**Prerequisite:** 12a.

## Context

**Gallery.** `ProductImageGallery.tsx:21` slices the thumbnail list to 4
(`resolvedImages.slice(0, 4)`) and `activeIndex` is only ever set from that
sliced list (line 44) — so images 5 and beyond are **completely unreachable**.
There is no zoom, no keyboard navigation, and no mobile swipe.

**Selectors.** Neither is an accessible control:

- `ColorSelector.tsx:20-33` renders `<button>` swatches with a `title` and
  `sr-only` text, but **no `aria-pressed`, no radio semantics, and no visible
  colour name**. Colour is conveyed by the swatch alone.
- `SizeSelector.tsx:25-41` is a flat list of buttons — no `radiogroup`, no
  arrow-key navigation. Out-of-stock state uses `opacity-40` + `line-through`
  (line 32), which is below the 3:1 non-text contrast minimum and is not
  announced.
- Colour swatches are `size-8` (32px) — below the 44px touch target minimum.

**Variant awareness.** `ProductDetailClient.tsx:43-48` computes
`unavailableSizes` per selected colour, but falls back to the product-level
`in_stock` flag whenever no matching variant row exists. Until prompt 23 gives
the admin a way to create variants, that fallback is always taken.

## Task

**`ProductGallery`** (rename from `ProductImageGallery`):

- **Remove the `slice(0, 4)`.** Show every image in the thumbnail strip; scroll
  it if long.
- Main image `aspect-[3/4]`, `object-cover`, `priority` on index 0.
- Keyboard: left/right arrows change the active image; thumbnails are a
  `tablist`/`tab` pattern with roving tabindex.
- Desktop: click-to-zoom in a shadcn `Dialog`, with the full-resolution image.
- Mobile: swipeable carousel using CSS `scroll-snap-type: x mandatory` plus dot
  indicators. **No carousel library.**
- `alt` is `${productName} — image ${i + 1}`, as it already is.

**`SizeSelector`** — rewrite as `role="radiogroup"` with `aria-label="Size"`:

- Each option is `role="radio"` with `aria-checked` and a roving tabindex.
- Arrow keys move and select; Home/End jump to first/last.
- Unavailable options get `aria-disabled="true"`, an `sr-only` "out of stock",
  and a strikethrough that meets 3:1 against the background — raise the opacity
  and use a solid line in `--color-store-ink-muted` rather than `opacity-40`.
- Minimum 44×44px hit area.

**`ColorSelector`** — same radiogroup treatment, plus:

- Show the **colour name** next to or under each swatch. Never rely on the
  swatch alone.
- Selected state gets a ring that is visible against both light and dark
  swatches (use a double ring: inner white, outer ink).
- Pad to a 44×44px hit area while keeping the 32px visual swatch.
- `COLOR_MAP` (`constants/index.ts:115`) covers 10 names and falls back to
  `#9ca3af`. Add a `title` showing the raw value when it is not in the map so
  admins can spot unmapped colours.

Selecting a colour re-derives available sizes. Keep that logic in
`ProductPurchasePanel` from 12a, not in the selectors — they stay controlled
and presentational.

## Acceptance

- Every product image is reachable from the thumbnail strip.
- Both selectors are fully operable with arrow keys and announced correctly by
  VoiceOver/NVDA as radio groups with the selected value.
- Out-of-stock sizes are distinguishable without relying on opacity alone.
- All interactive targets are ≥44×44px on touch.
- Selecting a colour updates which sizes are unavailable.
