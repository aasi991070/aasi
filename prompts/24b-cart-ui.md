# 24b — Cart UI

**Scope:** `components/storefront/CartButton.tsx`, `CartDrawer.tsx`,
`CartLineItem.tsx`, `QuantityStepper.tsx`, `AddToCartButton.tsx`,
`app/(storefront)/cart/page.tsx`, `Navbar.tsx`.

**Prerequisite:** 24a.

## Context

`AddToCartButton` was created in prompt 10 and wired into the PDP in 12a, both
times with a `// TODO(24b)` and a disabled state. `CartButton` in the navbar
(prompt 08) renders a hardcoded `0`. This prompt makes all of it real.

## Task

**`AddToCartButton`** — calls `addToCart` via `useTransition`. Pending state on
the button, success toast, opens the drawer, and announces the change through
the `LiveRegion` from prompt 13 ("Added. 3 items in cart"). Disabled when out of
stock, or on the PDP when the product has sizes and none is selected — with the
reason visible, not just a greyed button.

**`CartButton`** — item count badge fed from `getCart()`. Replace the hardcoded
`0`. Badge hidden at zero rather than showing "0".

**`CartDrawer`** — shadcn `Sheet` from the right (bottom on mobile). Opens on
successful add. Lists items with thumbnail, name, size/colour, quantity stepper,
remove, line total. Subtotal and a "Checkout" CTA. Empty state with a link to
the catalogue.

**`app/(storefront)/cart/page.tsx`** — the full cart: items, coupon field wired
to `applyCoupon` / `removeCoupon`, order summary (subtotal, discount, "shipping
calculated at checkout", total), "Continue shopping", empty state.

Surface the `priceChanged` and `stockReduced` flags from `getCart()` as inline
warnings on the affected line — "Price updated to ₹1,299" / "Only 2 left; qty
reduced". Do not fail silently.

**Optimistic updates.** React is pinned to `^18.3.1` (`package.json:27`), so
**`useOptimistic` is not available** — it is React 19. Use local state seeded
from the server value, updated immediately on interaction, and reconciled
against the action result inside `startTransition`. Roll back and toast on
failure.

**`QuantityStepper`** — `-` / number input / `+`. Debounce the server call by
400ms so holding `+` does not fire ten actions. Min 1 (below that, prompt to
remove), max clamped to available stock. Proper `aria-label`s and a
`role="status"` for the current quantity.

**Styling** — storefront tokens throughout. No `v18-*`.

**Accessibility** — add `/cart` to the axe route list in `tests/a11y.spec.ts`
(prompt 13 created it; 28a wires it to CI).

## Acceptance

- Adding from a product card and from the PDP both work, guest and signed-in.
- The navbar count updates without a full page reload.
- The cart survives a browser restart.
- A stale cart shows a visible price-change warning rather than silently
  re-pricing.
- Holding `+` fires one server action, not ten.
