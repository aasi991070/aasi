# 13 — Accessibility pass (WCAG 2.2 AA)

**Scope:** storefront components and pages, `app/globals.css`. No behaviour
changes beyond accessibility.

**Note:** prompt 12b already fixed the size and colour selectors. Do not redo them.

## Context — verified violations

- **Four `<h1>` on the home page.** `components/shared/PageHeader.tsx:28`
  always emits `<h1>`, and `HomePageClient.tsx` renders it three times —
  "Featured" (line 36), "Shop by Category" (40), "New Arrivals" (85) — on top of
  the hero's own `<h1>` in `Hero.tsx:32`.
- **`Hero.tsx:42`** — `alt="Hero"`. Not descriptive. Should be `alt=""` since
  the adjacent headline carries the meaning. (Prompt 12c may have done this;
  verify.)
- **No visible focus indicator** on any hand-rolled button — filter pills
  (`CategoryFilter.tsx:45-58`), colour swatches, `v18-btn-primary`/`store-btn`
  elements. The shadcn `Button` has `focus-visible:ring` (`button.tsx:8`);
  nothing else does.
- **`prefers-reduced-motion` is honoured by exactly one rule** —
  `.v18-stat-card:hover` (`globals.css:116-120`). Every other transition and
  transform ignores it.
- **No skip link and no landmarks** beyond `<main>` (prompt 07 added the skip
  link — verify it works).
- **`CategoryFilter`'s mobile sheet has no accessible name.** It uses Radix
  `Sheet` (`CategoryFilter.tsx:137-149`), which *does* already trap focus and
  restore it to the trigger — the real gap is a missing `SheetTitle` /
  `aria-label`, and missing `aria-pressed` on each pill.
- **Toasts are not announced.** Sonner renders, but there is no live region for
  cart and filter-result updates.

## Task

1. **Headings.** Give `PageHeader` an `as?: "h1" | "h2" | "h3"` prop defaulting
   to `"h2"`. Set `as="h1"` at exactly one place per page. Audit every route
   for heading order — no level may be skipped.

2. **Focus indicator.** In `globals.css`:
   ```css
   :focus-visible {
     outline: 2px solid var(--color-store-ink);
     outline-offset: 2px;
   }
   ```
   **Use ink, not accent.** `--color-store-accent` (`#c8a96e`) on white is about
   2.1:1 — below the 3:1 that WCAG 2.2 SC 1.4.11 requires for a focus
   indicator. Ink (`#0f0f0f`) is ~19:1. Add an admin variant using
   `--color-v18-primary` (which does pass on white).
   Never remove an outline without providing a replacement.

3. **Reduced motion.** Add a global block:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```
   Keep the existing `.v18-stat-card` rule; it becomes redundant but harmless.

4. **Landmarks.** `<header>`, `<nav aria-label="Primary">`, `<main id="content">`,
   `<footer>`. `CategoryBreadcrumb.tsx:21` already has
   `<nav aria-label="Breadcrumb">` — leave it.

5. **`CategoryFilter`.** Add a visually-hidden `SheetTitle` ("Filters"),
   `aria-pressed` on every pill, and `aria-label` on the min/max price inputs
   (they currently have only a `placeholder`, `CategoryFilter.tsx:94, 102`).

6. **Live region.** Add `components/shared/LiveRegion.tsx` — an
   `aria-live="polite" aria-atomic="true"` element fed from a small store — and
   mount it in the storefront layout. Used by prompts 18b and 24b for
   "3 items in cart" and "24 products match".

7. **Contrast.** Verify the new palette with a checker. Reference values:
   `--color-store-ink-muted` `#6b6b6b` on `--color-store-surface` `#fafaf8` is
   **~5.1:1** — passes AA for normal text at any size. Do **not** change it.
   The failures to fix are the accent on white (`#c8a96e`, ~2.1:1 — never use it
   for text or borders that convey meaning, only for large solid fills with ink
   text on top) and any `opacity-40` disabled state.

8. **Touch targets.** Every interactive target ≥44×44px. Audit the filter pills,
   pagination links, and gallery thumbnails.

9. **Forms.** Every input has a programmatic label. `StorefrontSearch` already
   has `aria-label` (line 43); the review form uses `<Label htmlFor>` correctly.
   Check the newsletter and contact forms from prompts 09a/09b.

## Verify

Add `@axe-core/playwright` and `tests/a11y.spec.ts` asserting zero serious or
critical violations on `/`, a category page, a PDP, and `/search`.

> Playwright and the `test:e2e` script are installed in **prompt 28a**. If you
> are running prompts in order, write the spec file now and leave it unwired;
> 28a picks it up. `/cart` is added to the route list in prompt 24b.

## Acceptance

- axe reports zero serious/critical violations on the four routes.
- Full keyboard traversal of the storefront with a visible focus indicator at
  every step.
- One `<h1>` per page, no skipped heading levels.
- Reducing motion in OS settings stops all animation.
