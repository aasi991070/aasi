# 26 — Razorpay payment and webhook

**Scope:** `lib/payments/razorpay.ts`, `app/api/payments/razorpay/`,
`app/(storefront)/checkout/`, `app/(storefront)/order/[orderNumber]/`.

**Prerequisite:** prompt 25. Requires the live Terms / Privacy / Refund /
Contact pages from prompt 09b — Razorpay will not activate the account without
them.

## Task

**Dependencies:** `razorpay` (server SDK). The checkout script is loaded from
`https://checkout.razorpay.com/v1/checkout.js` via `next/script` with
`strategy="lazyOnload"` — do not bundle it.

**Env** (document all four in `.env.local` and the README):

```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Only the `NEXT_PUBLIC_` one may reach the browser.

**Flow:**

1. `createPaymentAction(orderId)` — server action. Loads the order, asserts
   `payment_status = 'unpaid'`, calls `razorpay.orders.create({ amount, currency:
   'INR', receipt: order_number, notes: { orderId } })`, writes a `payments` row
   with `provider_order_id` and `status: 'created'`, returns the Razorpay order
   id and the public key.

   **Amount is always recomputed from the database and converted to integer
   paise:**
   ```ts
   const amount = Math.round(Number(order.total) * 100);
   ```
   `total` is `numeric(10,2)` and arrives as a JS float — `1234.35 * 100` is
   `123434.99999999999`, which Razorpay rejects. Never pass `total * 100`
   directly. Assert `Number.isInteger(amount)` before the call.
2. Client opens the Razorpay modal with that order id, prefilling name, email,
   and phone. `theme.color` set to `--color-store-accent`.
3. The browser `handler` callback routes to
   `/order/[orderNumber]?status=processing`. **It must not mark the order paid.**
4. **`app/api/payments/razorpay/webhook/route.ts` is the source of truth.**
   - `export const runtime = "nodejs"` — the raw body is required.
   - Read the raw body (`await request.text()`), verify
     `x-razorpay-signature` with `crypto.createHmac('sha256', WEBHOOK_SECRET)`
     using `crypto.timingSafeEqual`. Reject with 400 on mismatch, **before**
     parsing.
   - Handle `payment.captured`, `payment.failed`, `refund.processed`.
   - **Idempotent** on `provider_payment_id` (unique in the schema) — Razorpay
     retries. A duplicate delivery must be a no-op returning 200.
   - On capture, in one transaction: set `payment_status: 'paid'`,
     `status: 'confirmed'`, `placed_at: now()`; call `decrement_stock` for every
     line; mark the cart `converted`; increment `coupons.used_count`.
   - Always return 200 for events you understand, even when there is nothing to
     do — a non-200 makes Razorpay retry forever.
5. **Reconciliation fallback.** If the webhook has not arrived within ~20s, the
   order page polls a `verifyPaymentAction(orderNumber)` that calls
   `razorpay.payments.fetch` and applies the same transition through the same
   shared function. Never duplicate the state-transition logic.

**Order status page** `app/(storefront)/order/[orderNumber]/page.tsx` — states
for processing, confirmed, and failed. Failed offers "Retry payment", which
re-runs `createPaymentAction` against the same order.

**Failure paths that must be handled:** modal dismissed, payment failed, webhook
before the browser returns, webhook after, duplicate webhook, and a partial
refund.

## Test

Use Razorpay **test mode**. Verify with the CLI or a tunnel that a replayed
webhook does not double-decrement stock.

## Acceptance

- A test payment moves the order to `confirmed`, decrements variant stock, and
  clears the cart.
- Replaying the same webhook body changes nothing and returns 200.
- A tampered signature returns 400 and no state change.
- Closing the modal leaves the order recoverable via "Retry payment".
- `RAZORPAY_KEY_SECRET` never appears in any client bundle (grep `.next/static`).
