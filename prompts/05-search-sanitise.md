# 05 — Sanitise search input (stopgap before full-text search)

**Scope:** `lib/utils/searchText.ts`, `lib/queries/search.ts`,
`lib/queries/products.ts`, `hooks/useProducts.ts`.

## Context

Search filters are built by raw string concatenation into PostgREST's `or=`
grammar:

- `lib/queries/search.ts:46-51` and `89-95`
- `lib/queries/products.ts:22-27` (`buildAdminSearchOr`)
- `hooks/useProducts.ts:29-34`

All four produce `` `name.ilike.%${t}%` `` and `.join(",")`. The only sanitiser
is `tokenizeQuery` (`lib/utils/searchText.ts:4-10`), which lowercases and
splits on whitespace. It does not escape `,` `.` `(` `)` `%` `*` or backslash.

A query like `a,is_active.eq.false` or `a)` injects into or breaks the filter
expression. Table-level `.eq()` filters are AND-ed so inactive rows are not
exposed, but the result is 500s, empty result sets, and PostgREST error text
leaking to users.

Prompt 17 replaces this whole approach with Postgres full-text search. This
prompt is the safe stopgap.

## Task

In `lib/utils/searchText.ts`:

```ts
const SPLIT_ON = /[\s,.:;()\[\]{}"'\\/|]+/;   // treat PostgREST metachars as separators
const UNSAFE   = /[^\p{L}\p{N}\-_]/gu;        // then strip anything still risky

export function sanitizeToken(token: string): string
export function tokenizeQuery(query: string): string[]
```

- **Split on the metacharacters, do not just strip them.** Stripping turns
  `a,is_active.eq.false` into the single junk token `ais_activeeqfalse`, which
  matches nothing. Splitting yields `["a", "is_active", "eq", "false"]`, which
  behaves like an ordinary multi-word search.
- `sanitizeToken` removes anything left that is not a letter, digit, hyphen, or
  underscore, then trims. Use the `u` flag so non-Latin scripts survive.
- `tokenizeQuery` lowercases, splits on `SPLIT_ON`, sanitises each token, drops
  empties and single-character tokens, and **caps the result at 6 tokens of at
  most 32 characters each**.
- Export `MAX_QUERY_LENGTH = 128` and truncate the raw query before tokenising.

Add a small helper used by all four call sites so the `or=` string is built in
exactly one place:

```ts
export function buildIlikeOrFilter(
  tokens: string[],
  fields: readonly string[]
): string
```

Replace the four hand-rolled builders with calls to it. Delete
`buildAdminSearchOr` from `products.ts`.

Add `lib/utils/searchText.test.ts` (Vitest) covering: comma injection, closing
paren, `%` wildcard, over-long query, over-many tokens, empty query, and
unicode input (Devanagari and Arabic-script product names must survive).

If Vitest is not yet installed, add it as a devDependency plus a `test` script —
this is the one prompt allowed to add it.

## Acceptance

- `tokenizeQuery("a,is_active.eq.false")` returns
  `["is_active", "eq", "false"]` (the single-char `a` is dropped) and the search
  runs without error.
- Searching `%%%` returns no results and no error.
- Searching `कुर्ता` returns that token intact.
- `npm run test` passes.
