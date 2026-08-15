# 11 — Stop bypassing Next.js image optimisation

**Scope:** `components/shared/RemoteImage.tsx`, `next.config.mjs`,
`lib/storage/images.ts`, `components/admin/ImageUploader.tsx`.

## Context

`components/shared/RemoteImage.tsx:19`:

```ts
const preferUnoptimized = unoptimized ?? isSupabaseStorageUrl(src);
```

`isSupabaseStorageUrl` (`lib/storage/images.ts:35-39`) returns `true` for every
URL in the `product-images` bucket, and **no caller anywhere passes an explicit
`unoptimized` prop**. So every product image on the site is served as the
original upload: no resizing, no AVIF/WebP, no `srcset`. Phones download
full-resolution originals.

This is the largest LCP cost on the site, and it exists even though
`next.config.mjs:9-17` already whitelists the Supabase hostname correctly.

`RemoteImage` is also `"use client"`, so every component that renders a product
image is dragged across the client boundary.

## Task

**`RemoteImage`** — split into two:

- `components/shared/RemoteImage.tsx` — a **server component**. Renders
  `next/image` with the resolved URL. No `unoptimized`. No `useState`, no
  `useEffect`.
- `components/shared/RemoteImageWithFallback.tsx` — `"use client"`, keeps the
  `onError` → placeholder behaviour, used only where a broken image is likely
  (the admin uploader and the admin product table).

Storefront components use the server version.

**`next.config.mjs`** — add to `images`:

```js
formats: ["image/avif", "image/webp"],
deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
imageSizes: [64, 96, 128, 256, 384],
```

Every `imageSizes` value must be **smaller than the smallest `deviceSizes`
value** — Next documents this and warns otherwise. Keep the smallest device
size at 640; `imageSizes` covers the thumbnail cases below that.

Keep `minimumCacheTTL: 86400` and the existing `remotePatterns`.

**Blur placeholders** — add `getBlurDataUrl(path)` to `lib/storage/images.ts`
returning a tiny static base64 neutral shimmer keyed to
`--color-store-surface`. Pass `placeholder="blur"` on product imagery. Do not
generate per-image blurhashes in this prompt.

**`ImageUploader`** — before upload:

- Reject files over 8 MB and anything that is not `image/jpeg|png|webp|avif`.
- Downscale client-side to a max edge of 2400px and re-encode to WebP at
  quality 0.85 using a `<canvas>`. Keep the original filename in the storage
  path.
- Upload in parallel with `Promise.all` (currently serial, `useImageUpload.ts:17-22`)
  and report real aggregate progress.

## Verify

Load a PDP, open Network → Img. Every product image request must go through
`/_next/image?url=…&w=…&q=…`, not directly to `supabase.co/storage/...`.

## Acceptance

- No `unoptimized` prop anywhere except an explicit, commented opt-out.
- Storefront product images are served as AVIF/WebP at viewport-appropriate widths.
- Mobile LCP on a PDP improves measurably in Lighthouse.
