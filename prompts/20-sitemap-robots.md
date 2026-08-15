# 20 — Sitemap, robots, and metadata

**Scope:** new `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`,
`lib/metadata/product.ts`, `app/(storefront)/category/[...slug]/page.tsx`.

## Context

The site has **no SEO infrastructure at all**:

- No `app/sitemap.ts` and no `app/robots.ts`. Nothing tells a crawler the
  catalogue exists.
- `metadataBase` was missing until prompt 06 added it — before that, every
  Open Graph and Twitter URL resolved relative and broke when shared.
- `lib/metadata/product.ts:8-12` sets `openGraph.type: "website"` (should be
  `"product"`) with only a title and description. **No image.** Every product
  link shared to WhatsApp or Instagram renders a blank card.
- Filtered category URLs (`?sizes=M&colors=black&minPrice=…`) are fully
  crawlable and generate near-infinite duplicate content.
- `cursor-master-prompt.md:176` specifies the route `/products/[slug]`; the
  implementation is `/product/[slug]`. Any link built against the spec 404s.

## Task

**`app/sitemap.ts`** — dynamic sitemap listing:

- `/` (priority 1.0, `changeFrequency: "daily"`)
- every active category path, built from the tree (priority 0.8, weekly)
- every active product (`/product/[slug]`, priority 0.7, weekly,
  `lastModified: product.updated_at`)
- the static pages from prompt 09b (priority 0.3, monthly)

Use the cookie-free client from prompt 15 so the sitemap can be statically
generated. If the catalogue exceeds 5,000 URLs, split with
`generateSitemaps()`.

**`app/robots.ts`:**

```ts
rules: [{
  userAgent: "*",
  allow: "/",
  disallow: ["/admin", "/api", "/cart", "/checkout", "/account", "/order"],
}],
sitemap: `${SITE_URL}/sitemap.xml`,
```

**Do not disallow `/search`.** Prompt 21 registers a `WebSite.potentialAction`
→ `SearchAction` pointing at `/search?q=…` for the sitelinks search box, and a
`robots` disallow defeats it. Keep `/search` crawlable but mark result pages
`noindex, follow` via the route's `metadata` — that suppresses thin pages from
the index while leaving the endpoint reachable.

**Product metadata** — rewrite `buildProductMetadata`:

- `images: [resolveImageUrl(firstImage)]` with width/height and
  `alt: product.name`. **Leave `openGraph.type` as `"website"`** — `"product"`
  is not a member of Next's `OpenGraphType` union (`website | article | book |
  profile | music.* | video.*`) and setting it fails `tsc --noEmit`. Product
  semantics are expressed through JSON-LD in prompt 21, which is what Google
  actually reads.
- `twitter: { card: "summary_large_image" }`
- `alternates: { canonical: \`/product/${product.slug}\` }`
- Description falls back to a generated sentence when `description` is empty —
  never emit an undefined description.

**Category metadata** — add `alternates.canonical` pointing at the **unfiltered**
category path, and set `robots: { index: false, follow: true }` whenever any
filter or `page > 1` search param is present. This is the fix for the duplicate
content problem.

**OG image** — add `app/opengraph-image.tsx` using `next/og` for a branded
default card (wordmark on `--color-store-surface`), and
`app/(storefront)/product/[slug]/opengraph-image.tsx` composing the product
image with the name and price.

**Redirects** — add to `next.config.mjs`:

```js
async redirects() {
  return [{ source: "/products/:slug", destination: "/product/:slug", permanent: true }];
}
```

## Acceptance

- `/sitemap.xml` and `/robots.txt` return valid documents listing every active product.
- Pasting a product URL into WhatsApp shows an image card with name and price.
- A filtered category URL returns `<meta name="robots" content="noindex, follow">`
  and a canonical to the clean path.
- `/products/anything` 301s to `/product/anything`.
