# 24a — Cart: session, server actions, queries

**Scope:** `middleware.ts`, `lib/actions/cart.ts`, `lib/queries/cart.ts`.
No UI in this prompt.

**Prerequisite:** 22a, 22b.

## Context

Every "Add to Cart" button in the repo does nothing — `ProductCard.tsx:64-69`
and `ProductDetailClient.tsx:117-122` are bare `<button type="button">`
elements. Prompts 10 and 12a extracted them into `AddToCartButton` with a
`// TODO(24b)`. This prompt builds the server side of that.

`middleware.ts` currently matches `["/admin/:path*"]` only (line 30).

## Task

### Session identity

Guest carts key on an opaque `cart_session` cookie. Set it in `middleware.ts`
when absent:

- `crypto.randomUUID()`, `httpOnly`, `sameSite: "lax"`, `secure` in production,
  90-day `maxAge`, `path: "/"`.
- **Extend the matcher carefully.** It is currently admin-only; broadening it
  means `updateSession` (`lib/supabase/middleware.ts`) now runs on storefront
  routes too. Either scope the Supabase session refresh to `/admin` and
  `/account` with an early branch, or accept the cost knowingly — do not let
  it silently add a `supabase.auth.getUser()` round trip to every product page.
  Prefer the branch.
- Exclude static assets and `/_next` from the matcher.

When a user signs in, merge the guest cart into their user cart: sum
quantities per `(product_id, variant_id)`, clamp each to available stock, mark
the guest cart `converted`.

### `lib/actions/cart.ts` — `"use server"`

```ts
addToCart({ productId, variantId, qty })
updateCartItemQty(itemId, qty)
removeCartItem(itemId)
clearCart()
applyCoupon(code)
removeCoupon()
```

Rules, all enforced **server-side**:

- **Re-read the price from the database.** Never accept a price from the client.
  `unit_price_snapshot` is written from `products.effective_price` (the
  generated column from prompt 18a) at the moment of adding.
- Validate that the variant belongs to the product, that the product is active,
  and that `qty <= available stock`. **Clamp rather than error** where sensible,
  and return what happened so the UI can say so.
- **Do not decrement stock here.** Carts do not reserve inventory; stock is
  decremented on payment capture (prompt 26). Adding reservation later is a
  deliberate, separate decision — leave a comment saying so.
- Each action calls `revalidateTag("cart")` and returns a discriminated union:
  `{ ok: true; cart: Cart } | { ok: false; error: CartError }`. No thrown
  strings, no `any`.
- Cap total distinct lines at 50 and per-line qty at 10 to bound abuse.

### `lib/queries/cart.ts`

`getCart()` returns the cart with items joined to product and variant, plus
computed `subtotal`, `discount`, `itemCount`.

**Re-validate on read**, not just on write: compare each line's
`unit_price_snapshot` against current `effective_price` and each qty against
current stock, and return `priceChanged` / `stockReduced` flags per line so the
UI can warn. A cart sitting open for a week must not silently charge a stale price.

Cart reads are per-session, so they must **not** go through `unstable_cache` —
use the cookie-aware server client.

## Acceptance

- A `cart_session` cookie is set on first storefront visit and survives restart.
- Product pages do not gain a `supabase.auth.getUser()` call from the middleware change.
- Posting a forged price to `addToCart` has no effect on what is stored.
- Adding 999 of an item with 3 in stock stores 3 and reports the clamp.
- Signing in merges a guest cart without duplicating lines.
