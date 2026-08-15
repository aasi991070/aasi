# 21 — JSON-LD structured data

**Scope:** new `lib/seo/jsonld.ts`, `components/shared/JsonLd.tsx`, storefront pages.

## Context

There is **zero structured data** in the repo — a grep for `application/ld+json`,
`jsonLd`, or `schema.org` returns nothing outside `cursor-master-prompt.md`.

This matters commercially: price, availability, and star rating are all already
in the database (`products.price`, `sale_price`, `in_stock`, `stock_count`, and
the `product_reviews` aggregate from `getReviewSummary`), but Google cannot see
any of it. No rich results, no price in search listings, no review stars.

## Task

**`components/shared/JsonLd.tsx`** — a tiny server component:

```tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
```

The `<` escaping is required — do not skip it.

**`lib/seo/jsonld.ts`** — builders, all typed, no `any`:

- `organizationJsonLd()` — `Organization` with name, URL, logo, `sameAs` social
  links, and `contactPoint` using the support email from prompt 09b.
- `websiteJsonLd()` — `WebSite` with `potentialAction: SearchAction` pointing at
  `/search?q={search_term_string}` (enables the sitelinks search box).
- `productJsonLd(product, reviewSummary, reviews, categoryPath)` — `Product`
  with `name`, `description`, `image[]`, `sku` (use the product id until
  variants land), `brand: { "@type": "Brand", name: BRAND_NAME }`, and:
  - `offers`: `Offer` with `price: sale_price ?? price`, `priceCurrency: "INR"`,
    `availability: in_stock && stock_count > 0 ? InStock : OutOfStock`,
    `url`, and `priceValidUntil`
  - `aggregateRating`: only when `reviewSummary.count > 0` — omit the key
    entirely otherwise. Emitting an `aggregateRating` with `reviewCount: 0` is a
    Google structured-data error.
  - `review[]`: up to 5 approved reviews
- `breadcrumbJsonLd(path)` — `BreadcrumbList` from the category ancestry.
- `itemListJsonLd(products)` — `ItemList` for category and search pages.

**Wire it up:**

- `app/layout.tsx` — `organizationJsonLd` + `websiteJsonLd`
- `app/(storefront)/product/[slug]/page.tsx` — `productJsonLd` + `breadcrumbJsonLd`
- `app/(storefront)/category/[...slug]/page.tsx` — `itemListJsonLd` + `breadcrumbJsonLd`

Once variants exist (prompt 23), switch `Product` to use
`hasVariant` / `ProductGroup` and per-variant SKUs. Leave a `// TODO(23)`.

**Prices must be numbers, not formatted strings.** Do not pass `formatPrice()`
output into JSON-LD — it emits `₹1,299.00`, which is invalid.

## Verify

Run each page through Google's Rich Results Test and the Schema.org validator.
Zero errors, zero warnings on `Product`, `BreadcrumbList`, `Organization`.

## Acceptance

- PDP source contains valid `Product` JSON-LD with a numeric price and correct
  availability.
- A product with no reviews emits no `aggregateRating` key.
- Rich Results Test reports the PDP as eligible for product rich results.
