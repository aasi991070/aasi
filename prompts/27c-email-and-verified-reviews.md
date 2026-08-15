# 27c — Transactional email and verified-purchase reviews

**Scope:** `lib/email/`, migration `012_email_log.sql`,
`app/api/payments/razorpay/webhook/route.ts`, `lib/queries/reviews.ts`,
`app/api/reviews/route.ts`, admin moderation UI.

**Prerequisite:** 27a, 27b.

## Part 1 — Email

Use **Resend** (`resend` + `@react-email/components`). Templates as React
components in `lib/email/templates/`:

| Template | Trigger |
|---|---|
| Order confirmation | `payment.captured` webhook |
| Payment failed | `payment.failed` webhook |
| Shipped | admin adds a shipment (27b) |
| Delivered | admin marks delivered |
| Cancelled / refunded | admin cancels or refunds |
| Review request | 7 days after delivery |
| Contact form receipt | `contactAction` from prompt 09b |

Send from server actions and the webhook only — never from the browser.

**Email failures must never roll back an order.** Wrap every send in its own
try/catch, log, and record the outcome:

```sql
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  to_email citext not null, template text not null,
  status text not null check (status in ('sent','failed')),
  provider_id text, error text,
  created_at timestamptz not null default now()
);
```

Add an admin view listing failures with a resend button.

The review-request email needs a scheduler. Use a Supabase `pg_cron` job hitting
an authenticated internal route, or a Vercel Cron entry — pick one and document
it. Do not add a queue service.

Env: `RESEND_API_KEY`, `ORDER_FROM_EMAIL`. Templates render the brand palette
from prompt 06 with inline styles (email clients ignore stylesheets).

## Part 2 — Verified-purchase reviews

This closes the `// TODO(27c)` left on `createServiceClient()` in prompt 02.

- Populate `product_reviews.order_id` (column added in prompt 02) when the
  reviewer has a delivered order containing that product.
- Add an RLS `insert` policy allowing an authenticated user to insert a review
  **only** where such an order exists and `user_id = auth.uid()`:

  ```sql
  create policy "Verified purchasers can review" on product_reviews
    for insert to authenticated
    with check (
      exists (
        select 1 from orders o
        join order_items oi on oi.order_id = o.id
        where o.id = product_reviews.order_id
          and o.user_id = auth.uid()
          and o.status = 'delivered'
          and oi.product_id = product_reviews.product_id
      )
    );
  ```

- **Delete the `createServiceClient()` path** from `lib/queries/reviews.ts:50`.
  The API route now uses the session client for authenticated reviewers.
- Reviews with an `order_id` **auto-approve** (`status = 'approved'`) and render
  a "Verified purchase" badge. Reviews without one stay in the moderation queue
  from prompt 02, keeping the rate limit and spam checks.
- Add the moderation queue to the admin: pending list, approve, reject, bulk
  approve. Add "Reviews" to `ADMIN_NAV_ITEMS`.

## Acceptance

- A test order emits a confirmation email with correct line items and totals.
- A failed send is logged and does not affect order state.
- A customer can review only a product they have actually received.
- Verified reviews appear immediately; anonymous ones await moderation.
- `createServiceClient` no longer appears in `lib/queries/reviews.ts`.
