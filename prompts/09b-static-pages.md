# 09b — The nine static pages the footer links to

**Scope:** new routes under `app/(storefront)/`, one shared layout component,
one server action.

**Prerequisite:** 09a (the links exist and currently 404).

## Why this matters now

Razorpay will not activate a merchant account without live, reachable **Terms,
Privacy, Refund/Cancellation, and Contact** pages. This prompt unblocks
prompt 26.

## Task

**`components/storefront/ProseLayout.tsx`** — a server component: max-width
~68ch, display font for headings, sans for body, generous leading, storefront
tokens. Takes `title`, `updatedAt`, and children.

**Routes** — each a server component exporting `metadata` (title + description):

```
app/(storefront)/about/page.tsx
app/(storefront)/contact/page.tsx
app/(storefront)/shipping/page.tsx
app/(storefront)/returns/page.tsx
app/(storefront)/size-guide/page.tsx
app/(storefront)/faq/page.tsx
app/(storefront)/terms/page.tsx
app/(storefront)/privacy/page.tsx
app/(storefront)/refund-policy/page.tsx
```

**Write real structural copy, but do not invent legal or operational terms.**
Leave these as literal placeholders for Arif to fill:

```
[[REGISTERED_ENTITY]]  [[REGISTERED_ADDRESS]]  [[GSTIN]]
[[SUPPORT_EMAIL]]      [[SUPPORT_PHONE]]       [[SUPPORT_HOURS]]
[[REFUND_WINDOW_DAYS]] [[RETURN_WINDOW_DAYS]]  [[DELIVERY_SLA]]
[[SHIPPING_PARTNERS]]  [[JURISDICTION]]
```

Mark each page with `{/* TODO: legal review before launch */}`.

Size guide: a real measurement table for the sizes in `constants/index.ts:32`
(`XS`–`3XL`), in both cm and inches, with a toggle. Mark the measurements
`[[SIZE_CHART_TBC]]` — do not invent brand-specific fit.

FAQ: an accordion (shadcn), grouped Orders / Shipping / Returns / Product Care.

**Contact page** — name, email, message form posting to a `contactAction`
server action that writes to `contact_messages` (created in 09a), rate-limited,
with a success state. **No email sending in this prompt** — prompt 27c wires
Resend.

Add all nine to `app/sitemap.ts` when prompt 20 runs.

## Acceptance

- Every footer link resolves to a 200 page.
- All nine render correctly at 375px and pass a heading-order check.
- `grep -rn '\[\[' app/` lists exactly the placeholders above and nothing else.
- Contact form submissions land in `contact_messages`.
