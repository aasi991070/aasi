# 27a — Customer accounts and order lookup

**Scope:** `app/(storefront)/account/`, `middleware.ts`,
`lib/actions/account.ts`, `app/(storefront)/order/[orderNumber]/`.

**Prerequisite:** 26.

## Context

Auth exists only for the single admin (`app/admin/login/`). There is no customer
account concept. `middleware.ts:30` matches `["/admin/:path*"]`, extended in
prompt 24a to set the cart cookie.

Guest checkout works (prompt 25) and must keep working — accounts are optional,
never a gate.

## Task

**Auth** — Supabase Auth with email OTP / magic link. No password to store or
reset. Reuse `lib/supabase/client.ts` for the sign-in call; sessions are handled
by the existing `@supabase/ssr` middleware.

**Routes** under `app/(storefront)/account/`:

```
page.tsx                    overview
orders/page.tsx             order history, newest first, paginated
orders/[orderNumber]/page.tsx   detail — items, status timeline, addresses, invoice link
addresses/page.tsx          address book CRUD against the addresses table
profile/page.tsx            name, email, phone, marketing opt-in
sign-in/page.tsx            OTP request + verify
```

**Middleware** — add `/account/:path*` to the matcher without breaking the
admin branch or the cart-cookie logic from 24a. Unauthenticated `/account/*`
redirects to `/account/sign-in?redirect=…`, mirroring the admin pattern at
`middleware.ts:16-20`. Admin auth must be unaffected — verify explicitly.

**Guest → account linking.** On the order confirmation page, offer "Create an
account to track this order". On sign-up, link every existing order whose
`email` matches the verified address by setting `user_id`. Do this in a server
action against the **verified** session email — never a form field.

**Guest order lookup** — `app/(storefront)/order/lookup/page.tsx`: order number
+ email. Rate-limited via the shared `rate_limits` table from prompt 09a.
Constant-time compare, and identical response text whether or not the order
exists, so it cannot be used to enumerate customers.

**Order status page** (`order/[orderNumber]`) already exists from prompt 26 for
the payment states. Extend it with the fulfilment timeline: confirmed → packed →
shipped → delivered, with the carrier and AWB once prompt 27b adds shipments.

**RLS** — orders are readable where `user_id = auth.uid()`. The guest lookup path
goes through a server action using the service role after verifying the
order-number + email pair. Never widen the RLS policy to make guest lookup work.

## Acceptance

- A customer can sign in with an emailed code and see their order history.
- Admin login and `/admin` protection are unchanged.
- Guest checkout still completes without an account.
- Signing up with the checkout email surfaces the prior order.
- Order lookup with a wrong email returns the same message as a nonexistent
  order number.
