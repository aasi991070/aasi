# Aasi — luxury minimal clothing storefront

Next.js 14 storefront and admin CMS backed by Supabase, Razorpay checkout, and
Resend transactional email.

## Requirements

- Node.js 20+
- npm 10+
- Docker (for local Supabase in CI and for `supabase start`)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (optional locally; required for CI parity)

## Setup

```bash
npm ci
cp .env.example .env.local
# Fill in every value in .env.local (see Environment variables below)
```

Apply database migrations — see `supabase/migrations/README.md`. For local CI
parity:

```bash
supabase start
supabase db reset   # runs migrations + supabase/seed.sql
```

## Scripts

| Script                 | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Next.js dev server                                |
| `npm run build`        | Production build                                  |
| `npm run start`        | Production server                                 |
| `npm run typecheck`    | `tsc --noEmit`                                    |
| `npm run lint`         | ESLint via `next lint`                            |
| `npm run knip`         | Dead-code and unused dependency check             |
| `npm test`             | Vitest unit tests                                 |
| `npm run test:e2e`     | Playwright E2E (port 3100, `next start`)          |
| `npm run test:rls`     | Fail if any public table lacks RLS                |
| `npm run test:secrets` | Fail if server env names leak into `.next/static` |
| `npm run lighthouse`   | Lighthouse CI against production server           |
| `npm run gen:types`    | Regenerate `types/database.ts` from Supabase      |
| `npm run db:migrate`   | Apply migrations to remote Postgres               |

## Environment variables

Set these in `.env.local` for development and in the **Vercel project** for
production and preview deployments.

### Public (browser-safe)

| Variable                        | Purpose                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | Canonical origin (no trailing slash). Drives `metadataBase`, canonical URLs, and Open Graph links. |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                                                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-constrained)                                                                |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`   | Razorpay checkout key id (browser)                                                                 |

### Server-only (never prefix with `NEXT_PUBLIC_`)

| Variable                    | Purpose                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS — server actions and webhooks only                                     |
| `SUPABASE_DB_PASSWORD`      | For `npm run db:migrate` only (not used at runtime)                                 |
| `REVALIDATE_SECRET`         | Shared secret for `POST /api/revalidate`                                            |
| `REVIEW_IP_SALT`            | Salt for hashing review submitter IPs (`POST /api/reviews` fails closed without it) |
| `RAZORPAY_KEY_ID`           | Razorpay server API key id                                                          |
| `RAZORPAY_KEY_SECRET`       | Razorpay server API secret                                                          |
| `RAZORPAY_WEBHOOK_SECRET`   | Razorpay webhook signature secret                                                   |
| `RESEND_API_KEY`            | Resend transactional email                                                          |
| `ORDER_FROM_EMAIL`          | Verified sender, e.g. `Aasi <orders@yourdomain.com>`                                |
| `CRON_SECRET`               | Bearer token for Vercel Cron (`/api/cron/review-requests`)                          |
| `SENTRY_DSN`                | Sentry DSN for server and edge (optional locally)                                   |
| `NEXT_PUBLIC_SENTRY_DSN`    | Sentry DSN for the browser bundle                                                   |
| `SENTRY_AUTH_TOKEN`         | Source map upload on Vercel builds (optional locally)                               |
| `SENTRY_ORG`                | Sentry organisation slug (build-time, optional)                                     |
| `SENTRY_PROJECT`            | Sentry project slug (build-time, optional)                                          |

CI asserts that none of the server-only names above appear in `.next/static/**`
after a production build.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push and pull request:

```
typecheck → lint → knip → test → supabase db reset → RLS advisors → build →
secret leak check → test:e2e → lighthouse
```

E2E and Lighthouse run against a **local Supabase stack** seeded with
`supabase/seed.sql` — never production.

## Monitoring

When `SENTRY_DSN` is set, `@sentry/nextjs` captures unhandled errors and every
`DataError` from the query layer (tagged with `data.op`). PII is stripped via an
allowlist scrubber before upload — emails, phone numbers, addresses, payment
payloads, and Razorpay identifiers are removed.

Sample rates: **100% errors**, **10% traces**.

## Pre-commit

Husky runs `tsc --noEmit` and `lint-staged` (ESLint `--fix` + Prettier) on staged
files.
