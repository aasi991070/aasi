# 09a — Rebuild the footer

**Scope:** `components/storefront/Footer.tsx`, `constants/index.ts`,
one migration, one server action.

## Context

`Footer.tsx` exists but was imported nowhere until prompt 07 wired it. Its
"Company" and "Legal" columns are dead `<span>` elements, not links — `About`
(line 39), `Contact` (42), `Privacy` (52), `Terms` (55). Its Shop column
hardcodes `/category/mens` and `/category/womens` (lines 22, 27), ignoring the
real category tree.

Its classes (`bg-store-white`, `text-store-ink`, `border-store-border`) only
started resolving after prompt 06 added the tokens.

## Task

Make `Footer` a **server component** with four columns:

- **Shop** — level-1 categories from `getCategoriesByLevel(1, true)`. Use the
  `unstable_cache` + `createPublicClient()` path from prompt 03 — a
  cookie-reading query here would make every storefront route dynamic and
  defeat prompt 15.
- **Help** — Contact, Shipping & Delivery, Returns & Exchanges, Size Guide, FAQ
- **Company** — About
- **Legal** — Terms of Service, Privacy Policy, Refund & Cancellation Policy

The link targets are created in prompt 09b. Add them now; they 404 until then.

Plus:

- Newsletter email capture — a form posting to a `subscribeAction` server
  action. Validate the email, upsert on conflict, return a typed result, show
  inline success and error states. No third-party newsletter service.
- Social links (from `constants`), payment-method icons, copyright line.
- Hairline top border, no shadow, ≥80px vertical padding, storefront tokens
  only. Stack to a single column below `md`.

**Migration** `supabase/migrations/005_site_content.sql` (this number is
reserved for it — see the numbering table in prompt 01):

```sql
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'subscribed'
    check (status in ('subscribed','unsubscribed')),
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email citext not null, message text not null,
  created_at timestamptz not null default now()
);
```

Enable `citext` first. RLS on both: insert allowed to `anon`, select restricted
to `is_admin()`. Rate-limit `subscribeAction` by reusing the
`review_rate_limits` pattern from prompt 02 (rename the table to
`rate_limits` with a `bucket` column and migrate prompt 02's usage — do it here,
before more callers appear).

**Constants** — add `FOOTER_NAV_GROUPS` and `SOCIAL_LINKS` to
`constants/index.ts`. No hardcoded copy in the component, per the project's
modularity rules.

## Acceptance

- Adding a level-1 category in the admin makes it appear in the footer.
- Newsletter signup persists and rejects duplicates gracefully.
- No `v18-*` class remains in `Footer.tsx`.
- Footer renders correctly at 375px.
