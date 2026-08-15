# 27b — Admin order management

**Scope:** `app/admin/(cms)/dashboard/orders/`, `lib/actions/orders.ts`,
`lib/queries/orders.ts`, migration `011_order_events.sql`,
`lib/queries/products.ts` (`getDashboardStats`).

**Prerequisite:** 26.

## Context

The admin CMS manages products and categories only. Once orders exist there is
no way to see, fulfil, or refund them.

`getDashboardStats` (`lib/queries/products.ts:297-328`) returns four counts —
total products, active products, out of stock, total categories. Useful for a
catalogue tool, useless for running a shop.

## Task

### Migration `011_order_events.sql`

```sql
create table if not exists order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  actor_id uuid references auth.users(id),
  from_status text, to_status text,
  event_type text not null,   -- 'status_change' | 'note' | 'refund' | 'shipment'
  payload jsonb,
  created_at timestamptz not null default now()
);
create index on order_events (order_id, created_at desc);
```

RLS: `is_admin()` only. Every state change writes a row.

### Order list

`app/admin/(cms)/dashboard/orders/page.tsx` — server component. Filters by
status, payment status, and date range; search by order number, email, or phone;
newest first; paginated. Columns: order number, date, customer, items count,
total, payment status badge, fulfilment status badge, actions.

Add "Orders" to `ADMIN_NAV_ITEMS` (`constants/index.ts:88`) under a new
"Sales" section.

### Order detail

Items with their snapshots (not live product data — that is the point of the
snapshots), addresses, payment history from `payments`, and the `order_events`
timeline.

### Status machine

Enforce transitions **server-side**, not by hiding buttons:

```
pending   → confirmed | cancelled
confirmed → packed | cancelled
packed    → shipped | cancelled
shipped   → delivered | returned
delivered → returned
cancelled, returned → terminal
```

Reject anything else with a typed error. Each transition writes an
`order_events` row with the acting admin's id, and fires the matching email from
prompt 27c.

### Shipments and refunds

- Adding a shipment (carrier + AWB) inserts into `shipments` and moves the order
  to `shipped`.
- Cancel and refund: call the Razorpay refund API, insert a `payments` row with
  the refund, restock via the `restock()` function from 22b, and set
  `payment_status` to `refunded` or `partially_refunded`. Partial refunds must
  specify which line items.

### Real dashboard metrics

Replace `getDashboardStats` with `getSalesMetrics()`: revenue today / 7d / 30d,
order count and AOV over the same windows, top 5 products by units and by
revenue, low-stock alerts (variants under a threshold), and pending-review
count. Keep the catalogue counts as a secondary row.

Write it as one SQL RPC rather than eight round trips.

## Acceptance

- An invalid transition (e.g. `delivered → packed`) is rejected by the server
  even if the request is forged.
- Every state change is attributable to an admin in `order_events`.
- Refunding restocks the exact variants and quantities.
- The dashboard shows revenue, not just product counts.
