# 28b — CI, performance budgets, and error monitoring

**Scope:** `.github/workflows/`, `next.config.mjs`, `instrumentation.ts`,
`sentry.*.config.ts`, `lighthouserc.json`, husky.

**Prerequisite:** 28a.

## Context

There is no CI and no error monitoring. Prompt 04 introduced a `DataError`
class that currently only `console.error`s — nothing routes it anywhere a human
will see it.

## Task

### CI — `.github/workflows/ci.yml`

On push and pull request:

```
typecheck → lint → knip → test → build → test:e2e → lighthouse → supabase-advisors
```

All blocking. Cache `node_modules` and `.next/cache`. Run E2E against a seeded
Supabase branch or a local Postgres, never production.

**Supabase advisors step** — run the advisors and fail on any table reporting
missing RLS. This is the regression guard for prompt 01; without it a future
migration can quietly ship an unprotected table.

### Lighthouse CI

Budget on `/`, a category page, and a PDP, **mobile emulation**:

```
LCP < 2500ms, CLS < 0.1, TBT < 200ms
Performance ≥ 85, Accessibility = 100, SEO = 100, Best Practices ≥ 90
```

Fail the build on regression. Record the baseline from the first green run in
`lighthouserc.json` so improvements ratchet.

### Sentry

Add `@sentry/nextjs`:

- `instrumentation.ts` for server init. **Next 14 ignores `instrumentation.ts`
  unless you set `experimental: { instrumentationHook: true }` in
  `next.config.mjs`** — add it.
- Client and edge configs, source-map upload on Vercel, release tagging from the
  git SHA.
- Wire the `DataError` class from prompt 04 so every database failure becomes an
  attributable alert carrying the operation name.
- **Scrub PII before send**: emails, phone numbers, addresses, the entire
  `payments.raw_payload`, and any Razorpay identifiers. Use `beforeSend` with an
  explicit allowlist of fields, not a denylist.
- Set a sample rate that fits the plan — 100% errors, ~10% traces.

### Pre-commit

`husky` + `lint-staged`: `eslint --fix` and `prettier` on staged files, plus
`tsc --noEmit` on the whole project (fast enough with incremental builds).

### Vercel

- Add every env var from the prompts to the Vercel project and document the full
  list in `README.md`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET`, `REVIEW_IP_SALT`,
  `NEXT_PUBLIC_SITE_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
  `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RESEND_API_KEY`,
  `ORDER_FROM_EMAIL`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`.
- Add a CI assertion that no non-`NEXT_PUBLIC_` variable name appears in
  `.next/static/**` after a build. `RAZORPAY_KEY_SECRET` leaking into a client
  bundle would be the worst outcome in this repo.

## Acceptance

- CI is green on a clean checkout and blocks a PR that breaks types, tests,
  a11y, RLS, or the performance budget.
- A thrown `DataError` in production produces a Sentry issue with the operation
  name and **no customer PII**.
- The secret-leak check fails if you deliberately reference
  `process.env.RAZORPAY_KEY_SECRET` in a client component.
