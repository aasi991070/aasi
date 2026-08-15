# 00 — START HERE (autonomous run)

Paste this whole file into Cursor Composer in **agent mode**, once. It drives
the entire remediation from prompt 01 to 28b without further instruction.

---

You are the engineer on this codebase. There is a complete, verified
remediation plan in `prompts/`. Your job is to execute it end to end,
autonomously, committing as you go — not to re-plan it.

## What this project is

`C:\Projects\Website` — "Aasi", a luxury clothing storefront on Next.js 14.2.35
(App Router), Supabase, Tailwind v4, shadcn/ui, deployed on Vercel. Currency
INR, locale en-IN.

It is currently a product catalogue wearing an admin dashboard's skin. It has no
cart, no checkout, no payments. `prompts/README.md` explains the shape of the
work; each numbered file is one scoped task with its own acceptance criteria.

## Before your first task

1. Copy `prompts/.cursor/rules/storefront-design-system.mdc` and
   `prompts/.cursor/rules/v18-design-system.mdc` over `.cursor/rules/`,
   replacing the existing `v18-design-system.mdc`.

   The current rule says to use `V18Shell` for *both* storefront and admin. That
   one line is why the shop looks like a dashboard. Until it is replaced, you
   will keep undoing your own work.

2. Create `PROGRESS.md` at the repo root using the template at the bottom of
   this file. This is your memory across context resets — if you lose context,
   read it and resume from the first unchecked row. Never trust your context
   over `PROGRESS.md`.

3. `git checkout -b remediation` if you are on `main`.

## The loop

Repeat until every prompt is done:

1. Read `PROGRESS.md`. Take the first row that is not `done`.
2. Read that prompt file in full. Read every source file it names **before**
   editing anything — its line references were verified against the code, so if
   something does not match what you find, the code has drifted since. Note it
   in `PROGRESS.md` and adapt.
3. Do the work.
4. Run the gate (below). Fix what it catches. Do not proceed on a red gate.
5. Check the prompt's own acceptance criteria one by one. Be honest — a
   criterion you did not verify is not met.
6. Commit: `git commit -m "<prompt-id>: <what changed>"`. One prompt, one
   commit.
7. Update `PROGRESS.md`: mark the row `done`, record anything you changed your
   mind about, anything you deferred, and anything the next prompts need to know.
8. Go to 1. **Do not stop to ask permission between prompts.**

## The gate

```
npm run typecheck && npm run lint && npm run build
```

Plus, from prompt 05 onward, `npm run test`; from 28a onward, `npm run test:e2e`.

Never commit with a failing gate. Never silence a failure with `any`,
`@ts-ignore`, `eslint-disable`, or a widened type. If a fix is genuinely out of
scope for the current prompt, note it in `PROGRESS.md` and address it in the
prompt that owns that file.

## Your license to enhance

The prompts are a floor, not a ceiling. Where you can see a better answer,
take it — and write down what you did and why in the commit message and
`PROGRESS.md`.

**Yours to decide, without asking:**

- Component decomposition, file layout, and naming inside a prompt's scope.
- Better types, better error messages, better loading and empty states.
- Extra tests, extra indexes, extra validation, extra a11y beyond what is asked.
- Micro-interactions, transitions, and copy polish consistent with the
  storefront design rule.
- A cleaner implementation than the one sketched, as long as the acceptance
  criteria still hold. If a prompt suggests an approach that is wrong for the
  version of the stack you actually find installed, use the correct one and say
  so.
- Small adjacent fixes you notice — a missing `key`, a wrong `aria-label`, a
  race — if they are in a file you were already editing. Mention them in the
  commit.
- Adding a dependency the prompt did not name, **if** it removes more code than
  it adds and is well-maintained. Justify it in the commit message.

**Not yours to change:**

- The order of the prompts, or the migration numbering table in prompt 01.
- Anything a prompt calls a non-negotiable, a hard rule, or a security boundary.
- Money handling: server-side price re-derivation, `numeric(10,2)`, integer
  paise, webhook-as-source-of-truth, idempotency on `provider_payment_id`.
- RLS posture: writes gated on `is_admin()`, the browser client never writes to
  tables.
- The storefront/admin design split. No `v18-*` token or class under
  `app/(storefront)/` or `components/storefront/`, ever.
- Deleting anything under `supabase/migrations/` that has already been applied.

## Hard facts about this stack — do not get these wrong

- **React is 18.3.1**, not 19. No `useOptimistic`, no `useActionState`, no
  `use()`. Use `useTransition`, and `useFormState` from `react-dom` if you need
  form state.
- **Next is 14.2.35**, not 15. `cookies()` anywhere in a layout makes the entire
  route subtree dynamic. Reading `searchParams` in a page makes that route
  dynamic. `<Suspense>` does not change either — partial prerendering is
  canary-only. This is why several prompts move data reads onto a cookie-free
  client.
- **Tailwind is v4** — CSS-first. Tokens live in the `@theme` block in
  `app/globals.css`. There is no `tailwind.config.js` and you should not create
  one.
- **`openGraph.type: "product"`** is not in Next's `OpenGraphType` union and
  will fail `tsc`. Product semantics go in JSON-LD.
- Supabase migrations are applied **by hand** in the SQL Editor. Write them to
  be idempotent and safe against the live database. Tell me in `PROGRESS.md`
  when one is ready to run — do not assume it has been.
- `components/ui/**` is generated shadcn. Do not edit it; wrap it.

## Stop and ask me only for these

Everything else, decide yourself and keep moving.

1. **A migration that could lose data** — a destructive `alter`, a `drop
   column` where the backfill is ambiguous, or anything touching live orders.
   Write the SQL, explain the risk, wait.
2. **Credentials or external accounts** — Razorpay keys, Resend domain
   verification, Sentry DSN, disabling Supabase public signup. Prepare
   everything around it, list exactly what you need, continue with the next
   prompt that is not blocked.
3. **The `[[PLACEHOLDER]]` values** in prompt 09b — legal terms, refund windows,
   GSTIN, support contacts, size measurements. Leave them as placeholders. Do
   not invent them.
4. **A prompt whose premise is now false** — e.g. it describes code that no
   longer exists because an earlier prompt restructured it. Say what you found
   and what you propose, then proceed with your proposal unless it is a
   security or money boundary.
5. **You are about to violate a "not yours to change" item** to satisfy an
   acceptance criterion. That means the plan has a conflict. Flag it.

Do not stop to ask whether to continue. Do not summarise and wait. Do not ask
me to confirm an approach that falls under your license above.

## Reporting

Keep it short and factual. After each prompt, one line in chat: what you did,
anything you changed from the plan, anything deferred. Save the detail for
`PROGRESS.md` and the commit messages. No progress-report essays.

At each phase boundary (after 05, 14, 21, 27c, 28b), give me a five-line
summary and the current gate output, then **keep going**.

## PROGRESS.md template

```markdown
# Remediation progress

Branch: remediation · Started: <date>

## Phase 0 — Stabilise
- [ ] 01-schema-baseline-rls
- [ ] 02-lock-down-reviews
- [ ] 03-fix-revalidate
- [ ] 04-error-handling
- [ ] 05-search-sanitise

## Phase 1 — Storefront rebuild
- [ ] 06-storefront-tokens
- [ ] 07-storefront-shell-swap
- [ ] 08-navbar-rebuild
- [ ] 09a-footer
- [ ] 09b-static-pages
- [ ] 10-product-card
- [ ] 11-image-optimisation
- [ ] 12a-pdp-layout
- [ ] 12b-pdp-gallery-and-selectors
- [ ] 12c-remaining-storefront-surfaces
- [ ] 13-accessibility
- [ ] 14-dead-code

## Phase 2 — Performance & SEO
- [ ] 15-restore-isr
- [ ] 16-query-dedupe
- [ ] 17-indexes-and-fts
- [ ] 18a-category-query-and-pagination
- [ ] 18b-filter-ui-and-facets
- [ ] 19-single-query-layer
- [ ] 20-sitemap-robots
- [ ] 21-structured-data

## Phase 3 — Commerce
- [ ] 22a-commerce-schema-core
- [ ] 22b-commerce-schema-support
- [ ] 23-variants-admin
- [ ] 24a-cart-actions
- [ ] 24b-cart-ui
- [ ] 25-checkout
- [ ] 26-razorpay
- [ ] 27a-customer-accounts
- [ ] 27b-admin-orders
- [ ] 27c-email-and-verified-reviews

## Phase 4
- [ ] 28a-tests
- [ ] 28b-ci-and-monitoring

## Migrations awaiting manual run in Supabase
| File | Written | Applied |
|---|---|---|

## Blocked on Arif
| Prompt | What I need |
|---|---|

## Decisions and deviations
| Prompt | What I changed from the plan | Why |
|---|---|---|

## Deferred
| Issue | Which prompt should own it |
|---|---|
```

---

Start now. Replace the Cursor rules, create `PROGRESS.md`, then begin
`prompts/01-schema-baseline-rls.md`. Work through to `28b` without stopping
except for the five cases above.
