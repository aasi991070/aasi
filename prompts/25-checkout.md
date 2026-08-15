# 25 — Checkout

**Scope:** `app/(storefront)/checkout/`, `lib/actions/checkout.ts`,
`lib/queries/shipping.ts`, `components/storefront/checkout/*`.

**Prerequisite:** 22a, 22b, 24a, 24b.

## Context

There is no checkout route, no address capture, no shipping calculation, and no
order creation. This prompt builds everything up to — but not including — the
payment call, which is prompt 26.

Currency is INR, locale `en-IN` (`constants/index.ts:20-21`). `formatPrice`
already handles this correctly.

## Task

**Route:** `app/(storefront)/checkout/page.tsx`. Guest checkout must work —
account creation is optional and offered *after* purchase, never as a gate.

Single-page checkout with three collapsible sections (not a multi-step wizard —
fewer drop-offs):

1. **Contact** — email + phone. Prefilled if signed in.
2. **Shipping address** — name, line1, line2, city, state, pincode, country
   (`IN`, locked for now), phone. On a 6-digit pincode, auto-fill city and state
   via the India Post API (`https://api.postalpincode.in/pincode/{pin}`) with a
   manual override and a graceful failure path. Validate: pincode `^[1-9][0-9]{5}$`,
   phone `^[6-9]\d{9}$`.
3. **Delivery method** — flat options from a new `shipping_rates` table
   (Standard / Express), with free shipping above a threshold. Add migration
   `010_shipping_rates.sql` (this number is reserved — see the table in prompt 01).

Right rail (sticky on desktop, collapsible summary on mobile): line items,
subtotal, discount, shipping, tax, total. Coupon entry reusing `applyCoupon`
from prompt 24a.

**`lib/actions/checkout.ts`** — `createOrderAction(input)`:

- Re-fetch the cart server-side and **recompute every figure from the database**.
  The client sends addresses and the chosen shipping method — nothing else.
  Never trust a client-supplied subtotal, discount, or total.
- Re-validate stock for every line. If anything changed, abort and return a
  typed error listing the affected items so the UI can show "2 items changed".
- Re-validate the coupon (active, within window, under usage limit, meets
  `min_subtotal`).
- Compute tax. **GST on garments in India depends on the item's price band** —
  do not hardcode a single rate. Add `tax_rate numeric(5,2)` and `hsn_code text`
  to `products` in the same migration (default 5.00) with a
  `TODO: confirm HSN codes and GST slabs with the accountant` comment. Copy the
  applied rate onto each `order_item.tax_rate` (the column exists from 22a) so
  historical orders stay auditable when rates change.
- Insert `orders` + `order_items` with full snapshots, `status: 'pending'`,
  `payment_status: 'unpaid'`, in one transaction. Generate `order_number`.
- **Do not decrement stock and do not clear the cart.** Both happen on payment
  confirmation (prompt 26).
- Return `{ orderId, orderNumber, total }`.

Wire the "Place order" button to call this and then hand off to a
`// TODO(26): initiate payment` stub that currently routes to
`/checkout/pending?order=…`.

**Validation:** react-hook-form + zod throughout, per the project convention.
Show field-level errors. Persist the form to `sessionStorage` so a refresh does
not lose it.

**Address book:** signed-in users can save and reuse addresses from the
`addresses` table.

## Acceptance

- A guest can complete every step and reach the payment hand-off.
- Editing the request body to change the total has no effect on the stored order.
- A cart with a since-sold-out item is blocked with a clear message naming the item.
- Pincode `560001` auto-fills Bengaluru, Karnataka.
- Every figure on screen matches the persisted order row.
