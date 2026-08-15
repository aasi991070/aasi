# 12c — Restyle the remaining storefront surfaces off v18

**Scope:** `components/storefront/Hero.tsx`, `GenderToggle.tsx`,
`SearchResultCard.tsx`, `StorefrontSearch.tsx`,
`app/(storefront)/search/page.tsx`, `lib/utils/highlightText.tsx`,
`components/shared/PageHeader.tsx`, `EmptyState.tsx`, `LoadingSpinner.tsx`.

## Context

Prompts 07–12b covered the layout, cards, and PDP. These files were missed and
still carry admin styling. Concretely, after prompt 07 removed the blue
gradient background:

- `Hero.tsx:32` renders the headline with `v18-text-on-gradient` — **white text
  on a white page.** Line 35 does the same for the subtitle. Line 48 overlays a
  `from-v18-bg-from/60` blue scrim. Line 52's CTA is a white outline button
  that hovers to `bg-v18-primary` blue.
- `app/(storefront)/search/page.tsx:61, 91` — section headings in
  `v18-text-on-gradient`, also white on white.
- `SearchResultCard.tsx` — `v18-card`, `v18-text-heading`, `text-v18-primary`
  throughout.
- `GenderToggle.tsx:16, 26-27` — `--radius-v18-btn`, `v18-btn-primary`,
  `v18-text-muted`.
- `PageHeader.tsx`, `EmptyState.tsx`, `LoadingSpinner.tsx` in
  `components/shared/` are used by **both** sides and hardcode v18 classes.
- `highlightText.tsx:32` marks matches with `bg-yellow-100`, which is off-palette.

## Task

**Hero** — this is the storefront's most important visual moment; rebuild it to
the spec rather than just recolouring. Per `cursor-master-prompt.md`
§"Storefront Design Rules": full-width, `min-height: 90vh`, headline overlaid on
the image with a semi-transparent scrim, single outlined-white CTA that fills to
accent on hover. Headline in the display font at 56–72px, weight 300, tracking
-0.02em. It keeps its own `<h1>` — prompt 13 makes sure it is the page's only one.

Make it a **server component**: it is currently `"use client"` (line 1) only
because it uses `RemoteImage`, and prompt 11 made the server version available.
Move the `getPublicUrl` resolution (lines 22–27) into the page and pass a
resolved URL in. Set `alt=""` — the headline beside it carries the meaning.

**Shared components** — give `PageHeader`, `EmptyState`, and `LoadingSpinner` a
`surface?: "store" | "admin"` prop defaulting to `"store"`, and branch the
classes. Do not fork them into two files.

**Search page and `SearchResultCard`** — storefront tokens, hairline separators,
no cards. Restyle `highlightText`'s `<mark>` to a subtle
`--color-store-accent` tint at low alpha with `text-inherit`.

**`GenderToggle`** — storefront pill toggle using `--color-store-accent` for the
active state.

**`StorefrontSearch`** — remove `text-v18-muted` and `--radius-v18-input`
(prompt 08 may have done this; verify).

## Acceptance

- `grep -rn "v18-" app/ components/storefront/ lib/` returns **zero** results.
- The hero headline is legible (it currently is not).
- `/search` renders correctly with and without a query.
- Admin pages are visually unchanged — verify `PageHeader` with
  `surface="admin"` still matches the old output.
