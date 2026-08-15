# 23 — Variant management in the admin (it reads variants but cannot create them)

**Scope:** `components/admin/ProductForm.tsx`, new
`components/admin/VariantMatrix.tsx`, `lib/actions/catalog.ts`,
`lib/queries/products.ts`.

## Context

`product_variants` is queried on every PDP (`lib/queries/products.ts:107, 124`)
and drives the out-of-stock size logic in `ProductDetailClient.tsx:43-48`. But
**nothing in the admin can create, edit, or delete a variant.** The table is
read-only from the application's point of view, so that logic always falls
through to the product-level `in_stock` flag and per-size stock is unusable.

`ProductForm` also has three smaller defects:

- **Colours and tags are uncontrolled.** Lines 210–222 and 226–239 use
  `defaultValue` + `setValue` without `register`, so react-hook-form does not
  track them — a form reset or validation failure silently loses them.
- **No `sale_price < price` validation** (schema at line 28), so a "sale" can be
  priced above the original.
- **`gender` is a hidden input** (line 186) auto-derived from the category. Fine,
  but it is invisible to the admin — surface it read-only so they can see it.

## Task

**`VariantMatrix`** — a grid of sizes × colours generated from the product's
`sizes[]` and `colors[]` arrays. Each cell exposes:

- stock count (number input)
- SKU (text, auto-suggested as `{SLUG}-{SIZE}-{COLOR}`, editable, unique)
- optional price override
- an enable/disable toggle

Bulk actions: "set all stock to N", "generate all SKUs", "clear disabled".

Changing `sizes` or `colors` on the product reconciles the matrix — new
combinations appear as disabled with zero stock, and removing a size warns
before deleting variants that carry stock.

**Actions:** add `saveVariantsAction(productId, variants[])` to
`lib/actions/catalog.ts` — a single upsert-and-delete transaction, admin-gated,
invalidating the `product:${slug}` tag. Never orphan a variant referenced by an
`order_items` row: soft-disable instead of deleting when it is.

**Queries:** add `getVariantsByProductId(productId)`; include variants in
`getProductById`.

**Fix the form defects:**

- Convert colours and tags to controlled fields with `register` + a proper
  tag-input component (chips with backspace-to-remove). Normalise colours to
  lowercase on save so the GIN index from prompt 17 works.
- Add a zod `.refine()` asserting `sale_price == null || sale_price < price`,
  with the error shown on the `sale_price` field.
- Add `stock_count` as read-only when variants exist — the product-level count
  becomes `sum(variants.stock_count)`, computed server-side.
- Show `gender` as a disabled input with a note explaining it is derived from
  the category.

**Also add the missing SEO fields** while you are in this form:
`meta_title`, `meta_description`, and per-image `alt_text`. Include the
migration column additions and wire them into `buildProductMetadata` and the
image components.

## Acceptance

- An admin can set per-size, per-colour stock and it appears on the PDP.
- Selecting a colour on the PDP updates which sizes show as out of stock.
- Saving a product with `sale_price >= price` shows a field-level error.
- Colours entered as "Navy" are stored as "navy".
- A variant referenced by an order cannot be hard-deleted.
