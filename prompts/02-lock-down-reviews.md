# 02 — Lock down the reviews endpoint

**Scope:** `app/api/reviews/route.ts`, `lib/queries/reviews.ts`,
`components/storefront/ProductReviews.tsx`, one new migration.

## Context

`POST /api/reviews` has no authentication, no rate limit, no CAPTCHA, and no
moderation. It validates field shapes (name length, rating range, body length)
and then inserts using `SUPABASE_SERVICE_ROLE_KEY` via `createServiceClient()`,
which bypasses RLS entirely. Field validation is not authorisation. A script
can post unlimited reviews under any name to any product, and they appear on
the storefront immediately.

Compare `app/api/settings/route.ts` lines 21–28, which does check
`supabase.auth.getUser()`. The reviews route does not.

## Task

**Migration** `supabase/migrations/004_review_moderation.sql`:

- Add to `product_reviews`: `status text not null default 'pending' check (status in ('pending','approved','rejected'))`,
  `order_id uuid` (nullable, for the verified-purchase link added later),
  `ip_hash text`, `updated_at timestamptz not null default now()`.
- Backfill existing rows to `'approved'`.
- Replace the public `select` policy so it only exposes
  `status = 'approved'`. Add an admin-only `select`/`update` policy using
  `is_admin()` from migration 003.
- Index on `(product_id, status, created_at desc)`.
- Create the rate-limit table the API section below needs:
  ```sql
  create table if not exists review_rate_limits (
    ip_hash text not null,
    window_start timestamptz not null,
    count int not null default 0,
    primary key (ip_hash, window_start)
  );
  ```
  RLS on, service-role only. Add a `delete from review_rate_limits where
  window_start < now() - interval '1 day'` cleanup at the top of each check.

**API route:**

- Add IP rate limiting: max 3 review submissions per IP per hour. Implement
  with a `review_rate_limits` table (`ip_hash`, `window_start`, `count`) checked
  and incremented in the same request. Do not add a Redis dependency.
- Hash the IP with SHA-256 plus a server-side salt from
  `process.env.REVIEW_IP_SALT` before storing. Never store a raw IP.
- Insert with `status: 'pending'`. Return `202` with a message telling the
  reviewer their review is awaiting moderation.
- Keep the existing field validation. Add server-side trimming and reject
  bodies containing URLs (a cheap, effective spam filter).
- `GET` must return only approved reviews.

**Query layer:** `getReviewsByProductId` and `getReviewSummary` filter on
`status = 'approved'`.

**UI:** after a successful submit, show "Thanks — your review will appear once
it's approved" instead of "Review submitted", and do not optimistically insert
the review into the list.

**Env:** add `REVIEW_IP_SALT` to `.env.local` and document it.

## Note for later

Prompt 27c replaces the service-role insert with an RLS-backed insert scoped to
a verified purchase. Leave a `// TODO(27c):` comment on the `createServiceClient()`
call marking it.

## Acceptance

- A submitted review does not appear on the page until an admin approves it.
- A fourth submission from the same IP within an hour returns `429`.
- No raw IP address is written to the database.
