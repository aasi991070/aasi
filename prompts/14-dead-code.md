# 14 — Delete dead code and duplicated components

**Scope:** deletions and small consolidations only. No feature work.

## Context

Audit found the following unused or duplicated:

| File | Status |
|---|---|
| `components/admin/AdminShell.tsx` (71 B) | exported, imported nowhere |
| `components/admin/AdminSidebar.tsx` (77 B) | exported, imported nowhere |
| `components/admin/AdminTopNav.tsx` (74 B) | exported, imported nowhere |
| `components/storefront/SearchBar.tsx` | 6-line pass-through (deleted in 08) |
| `components/admin/PageHeader.tsx` (61 B) | name collides with `shared/PageHeader.tsx` |
| `scripts/font-preview.html`, `scripts/generate-font-previews.mjs` | scratch files |
| `constants/index.ts:58` `AdminNavItem` | marked `@deprecated` |
| `next-themes` in `providers.tsx:44` | see below |

**`next-themes` is dead weight.** `app/providers.tsx:44` mounts
`<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>`,
but `app/globals.css` contains **zero** `dark:` variant styles and there is no
theme toggle on the storefront. Its only consumer is
`components/ui/sonner.tsx:10`. The "monochrome" toggle in the admin is a
separate mechanism (`MonochromeProvider`) and does not use it.

## Task

1. Delete all files in the table above and fix the imports they leave behind —
   `components/admin/PageHeader.tsx` importers move to
   `components/shared/PageHeader.tsx`.

   **Keep `lib/utils.ts`.** It is a one-line re-export of `lib/utils/cn.ts`,
   but 16 files import from `@/lib/utils` — all 15 shadcn primitives in
   `components/ui/` plus `BrandMark.tsx` — and `components.json:15` points the
   shadcn `utils` alias at it, so deleting it breaks every primitive and future
   `npx shadcn add`. Add a comment on the file saying exactly that.
2. Remove `next-themes`: delete the `ThemeProvider` wrapper from
   `providers.tsx`, replace `useTheme()` in `components/ui/sonner.tsx` with a
   hardcoded `theme="light"`, and drop the dependency from `package.json`.
3. Remove `AdminNavItem` and update any usage to `NavItem`.
4. Delete `STOREFRONT_NAV_ITEMS` from `constants/index.ts` if prompt 07 did not.
5. Add `knip` as a devDependency with a config that scans `app/`,
   `components/`, `lib/`, `hooks/`, `constants/`, `types/`. Add
   `"knip": "knip"` to scripts. Ignore `components/ui/**` (shadcn primitives are
   intentionally kept).
6. Add `eslint-plugin-unused-imports` to the ESLint flat config with
   `unused-imports/no-unused-imports: "error"`.
7. Run `npm run knip` and delete anything else it reports that is genuinely
   unreachable. **List what you deleted in the commit message.** Do not delete
   anything under `components/ui/` or `supabase/`.

## Do not

- Do not delete `components/storefront/Footer.tsx`, `Navbar.tsx`,
  `BrandMark.tsx`, or `GenderToggle.tsx` — prompts 07–09a bring them into use.
- Do not delete `cursor-master-prompt.md` — it is the design reference.
- Do not delete `lib/utils.ts` (see above) — add it to the `knip` ignore list.

## Acceptance

- `npm run build`, `npm run typecheck`, `npm run lint` all clean.
- `npm run knip` reports no unused files outside `components/ui/`.
- Bundle size on `/` drops (record the before/after from `next build` output).
