# Cursor Master Prompt — Clothing Store (Next.js + Supabase + Vercel)

Paste this entire prompt into Cursor at the start of your project.

---

## Project Overview

I am building a **luxury minimal clothing e-commerce website** with a single-admin CMS backend.

**Stack:**
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Storage + Auth)
- Tailwind CSS v4 + shadcn/ui (base-nova style)
- Framer Motion (subtle animations)
- Vercel (deployment)

**Two sides:**
1. **Storefront** — public-facing, luxury minimal aesthetic
2. **Admin CMS** — protected dashboard, professional SaaS aesthetic (deep blue chrome, white cards)

---

## Design System

### Brand identity
The storefront is **luxury minimal**: editorial typography, generous whitespace, near-black and off-white palette, restrained use of a single warm accent. Think high-end fashion house — nothing decorative that doesn't earn its place.

The admin is **professional SaaS**: deep blue sidebar, white content surfaces, clean data density. Inspired by a GovCon/enterprise dashboard aesthetic — authoritative and efficient.

These are two visually distinct experiences sharing one codebase.

---

## Design Tokens

Define all tokens in `globals.css` using Tailwind v4 `@theme` and CSS variables:

```css
@theme {
  /* Storefront — luxury minimal palette */
  --color-store-ink:        #0f0f0f;   /* near-black — primary text */
  --color-store-ink-muted:  #6b6b6b;   /* secondary text */
  --color-store-surface:    #fafaf8;   /* off-white page background */
  --color-store-white:      #ffffff;   /* card surfaces */
  --color-store-border:     #e8e6e1;   /* warm light border */
  --color-store-accent:     #c8a96e;   /* warm gold — single accent, use sparingly */
  --color-store-accent-dark:#9d7f48;   /* accent hover state */

  /* Admin — deep blue SaaS palette */
  --color-admin-sidebar-from: #1e3a8a;
  --color-admin-sidebar-to:   #1e40af;
  --color-admin-bg-from:      #1e3a8a;
  --color-admin-bg-mid:       #3b82f6;
  --color-admin-bg-to:        #f0f9ff;
  --color-admin-primary:      #1e40af;
  --color-admin-primary-hover:#1d4ed8;
  --color-admin-heading:      #1e293b;
  --color-admin-muted:        #64748b;
  --color-admin-border:       #e2e8f0;
  --color-admin-success:      #16a34a;
  --color-admin-warning:      #e85d04;
  --color-admin-danger:       #dc2626;

  /* Shared radii */
  --radius-card:    20px;
  --radius-btn:     10px;
  --radius-stat:    16px;
  --radius-input:   8px;

  /* Shared shadows */
  --shadow-card:    0 8px 32px rgba(0,0,0,0.08);
  --shadow-stat:    0 2px 12px rgba(0,0,0,0.06);
}
```

---

## Storefront Design Rules

### Visual language
- **Palette**: off-white background (`--color-store-surface`), near-black text (`--color-store-ink`), warm gold accent (`--color-store-accent`) used only on CTAs, price highlights, and hover states. Never on decorative elements.
- **Typography**: Use `next/font` to load **Cormorant Garamond** (display/headings — elegant serif) paired with **DM Sans** (body/UI — clean grotesque). Never Inter or Roboto.
  - Hero headline: Cormorant Garamond, 56–72px, font-weight 300, letter-spacing -0.02em
  - Section titles: Cormorant Garamond, 32–40px, font-weight 400
  - Body / labels / nav: DM Sans, 14–16px, font-weight 400
  - Price: DM Sans, font-weight 500
- **Whitespace**: Generous. Section vertical padding minimum 80px. Product grid gap minimum 32px. Nothing feels cramped.
- **Borders**: Hairline only — 1px `--color-store-border`. No box shadows on storefront cards.
- **Motion**: Framer Motion. Product card image — subtle scale(1.03) on hover over 400ms ease. Page transitions — fade in 200ms. No bounce, no spring — everything is slow and considered.
- **Imagery**: All product images use `object-fit: cover`, aspect-ratio 3/4 (portrait). Never distort.

### Storefront component rules
- `Navbar`: sticky, white background on scroll (transparent when at top), logo in Cormorant Garamond, nav links in DM Sans uppercase tracking-widest text-xs. No hamburger icon — use a minimal "Menu" text link on mobile.
- `ProductCard`: no card border at rest — only a hairline appears on hover. Price below name. Sale price in accent color with strikethrough original. No "Add to Cart" button visible until hover.
- `CategoryFilter`: left sidebar on desktop, bottom sheet on mobile. Pill-style filter tags, filled accent color when active.
- `Hero`: full-width, tall (min-height 90vh). Headline overlaid on image with semi-transparent scrim. Single CTA button — outlined, white, tracks to filled accent on hover.
- `SizeSelector`: horizontal pill row. Out-of-stock sizes: line-through, 40% opacity, not clickable.
- `CategoryBreadcrumb`: DM Sans, text-xs, muted color, chevron separator.

---

## Admin Design Rules

### Visual language
- **Layout chrome**: deep blue collapsible left sidebar + white top bar. Main area uses a deep-blue → light-blue → `#f0f9ff` body gradient.
- **Sidebar**: `background: linear-gradient(180deg, #1e3a8a, #1e40af)`. Active nav item: white text on `bg-white/20` pill. Icons: Lucide React (outline style only).
- **Top nav**: white bar with subtle shadow. Logo in blue. Admin avatar: orange→gold gradient circle.
- **Page headers**: white text on gradient background (`PageHeader` component with `variant="onGradient"`).
- **Cards**: white surface, `--radius-card` (20px), `--shadow-card`. Dark text only on white cards — never dark headings directly on the gradient.
- **Stat cards**: `--radius-stat` (16px), `--shadow-stat`, optional Framer Motion lift on hover.
- **Buttons**: primary = blue gradient (`#1e40af → #3b82f6`), `--radius-btn` (10px), min-height 44px. Outline variant available. Danger variant in red.
- **Inputs**: `--radius-input` (8px), border `--color-admin-border`, focus ring in primary blue.
- **Badges**: status tags using semantic colors — success `#16a34a`, warning `#e85d04`, danger `#dc2626`, info blue.
- **Tables**: white card wrapper, sticky header, row hover `bg-slate-50`, action icons in muted color.
- **Toasts**: Sonner, wired through a `useUiStore().showToast()` bridge.
- **Sidebar state**: managed by Zustand `uiStore` — `sidebarOpen` boolean, toggled from TopNav.

### Admin component rules
- `AdminSidebar`: collapsible. Expanded = 240px, collapsed = 64px (icons only). Transition 200ms ease. Nav items group by section with small uppercase labels.
- `AdminTopNav`: height 64px. Left: collapse toggle button + breadcrumb. Right: search input + notification bell + avatar.
- `PageHeader`: full-width, sits on gradient — title (white, 28px, font-weight 600) + subtitle (white/70, 14px). Accepts an optional right-side action slot.
- `ProductTable`: shadcn Table inside a white card. Columns: thumbnail (40px square), name + slug, category, price, stock badge, status badge, actions (edit/delete icons).
- `CategoryTreeView`: indented tree with expand/collapse chevrons. Each node: category name + level badge + edit/delete icons + "add child" button. Drag handle for reorder via `@dnd-kit`.
- `ImageUploader`: drag-and-drop zone + click-to-browse. Shows upload progress. Displays uploaded image thumbnails in a grid with remove button.
- `ProductForm`: two-column layout on desktop (left: main fields, right: images + pricing + toggles). Uses react-hook-form + zod. Category selector cascades through 4 levels.

---

## Libraries

Install and configure all of the following:

```json
{
  "dependencies": {
    "next": "14",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/ssr": "latest",
    "@supabase/supabase-js": "latest",
    "tailwindcss": "^4",
    "framer-motion": "^11",
    "lucide-react": "latest",
    "sonner": "latest",
    "zustand": "^4",
    "@tanstack/react-query": "^5",
    "react-hook-form": "^7",
    "zod": "^3",
    "@hookform/resolvers": "^3",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^8",
    "next-themes": "^0.3",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "class-variance-authority": "^0.7"
  }
}
```

shadcn/ui — install with base-nova style preset. Components to install:
`button dialog sheet dropdown-menu popover scroll-area label separator sonner skeleton table badge tabs input textarea`

Fonts via `next/font/google`:
- `Cormorant_Garamond` weights: 300, 400, 500 — used on storefront only
- `DM_Sans` weights: 400, 500 — used everywhere
- Apply as CSS variables: `--font-display` (Cormorant) and `--font-sans` (DM Sans)

---

## Folder Structure (strictly follow this)

```
/app
├── (storefront)/
│   ├── layout.tsx                        # Storefront layout — Navbar + Footer
│   ├── page.tsx                          # Homepage — hero + featured products
│   ├── products/
│   │   └── [slug]/page.tsx               # Product detail page
│   └── category/
│       └── [...slug]/page.tsx            # Category page (handles all 4 levels)
├── (admin)/
│   ├── layout.tsx                        # Admin shell — sidebar + topnav + auth guard
│   ├── login/page.tsx                    # Standalone auth page — own styles
│   └── dashboard/
│       ├── page.tsx                      # Overview — stat cards + recent products
│       ├── products/
│       │   ├── page.tsx                  # Product list table
│       │   ├── new/page.tsx              # Add product
│       │   └── [id]/page.tsx             # Edit product
│       ├── categories/
│       │   ├── page.tsx                  # Category tree view
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       └── settings/
│           └── page.tsx
├── api/
│   └── revalidate/route.ts               # ISR cache revalidation

/components
├── ui/                                   # shadcn/ui — never modify these directly
├── storefront/
│   ├── Navbar.tsx                        # Sticky, transparent-to-white on scroll
│   ├── Footer.tsx
│   ├── Hero.tsx                          # Full-height hero with overlay CTA
│   ├── ProductCard.tsx                   # Hover-reveal add button, scale image
│   ├── ProductGrid.tsx                   # Responsive grid, gap-8
│   ├── ProductImageGallery.tsx           # Main image + thumbnail strip
│   ├── CategoryFilter.tsx                # Sidebar (desktop) / bottom sheet (mobile)
│   ├── CategoryBreadcrumb.tsx
│   ├── SizeSelector.tsx                  # Pills, out-of-stock states
│   ├── ColorSelector.tsx                 # Color dot selector
│   ├── GenderToggle.tsx                  # Men's / Women's toggle
│   └── SearchBar.tsx
├── admin/
│   ├── AdminSidebar.tsx                  # Collapsible, blue gradient
│   ├── AdminTopNav.tsx                   # White bar, 64px
│   ├── PageHeader.tsx                    # White text on gradient, action slot
│   ├── StatCard.tsx                      # KPI tile with Framer hover
│   ├── ProductForm.tsx                   # Shared add + edit, two-column
│   ├── ProductTable.tsx                  # shadcn Table in white card
│   ├── ImageUploader.tsx                 # Drag-drop + progress + thumbnail grid
│   ├── CategoryForm.tsx                  # Shared add + edit
│   └── CategoryTreeView.tsx             # Expandable tree + dnd-kit reorder
└── shared/
    ├── LoadingSpinner.tsx
    └── EmptyState.tsx

/lib
├── supabase/
│   ├── client.ts                         # createBrowserClient
│   ├── server.ts                         # createServerClient + cookies
│   └── middleware.ts                     # session refresh helper
├── queries/
│   ├── products.ts                       # ALL product DB calls
│   └── categories.ts                     # ALL category DB calls
├── storage/
│   └── images.ts                         # upload / delete / getPublicUrl
└── utils/
    ├── slugify.ts
    ├── formatPrice.ts
    └── cn.ts                             # clsx + tailwind-merge

/hooks
├── useProducts.ts
├── useCategories.ts
├── useImageUpload.ts
└── useUiStore.ts                         # Zustand — sidebarOpen, showToast

/types
└── index.ts

/constants
└── index.ts

/middleware.ts                            # Protect /admin routes
```

---

## Strict Modularity Rules (never break these)

- All Supabase queries go in `/lib/queries/` — never inline DB calls in components or pages
- All storage operations go in `/lib/storage/images.ts` only
- Pages are thin — fetch data + pass props only, zero business logic
- `ProductForm` and `CategoryForm` are reused for both add and edit — accept an optional `existing` prop
- All TypeScript types live in `/types/index.ts` — no inline type definitions anywhere
- All client-side state and data logic goes in `/hooks/`
- Constants (sizes, bucket name, gender options, etc.) go in `/constants/index.ts` — never hardcoded inline
- shadcn components stay untouched in `/components/ui/` — wrap them in `storefront/` or `admin/` if customization is needed
- Never duplicate logic — if two places need the same function, put it in `/lib/utils/`
- Storefront and admin share zero visual styles — their CSS is fully separate via component scope

---

## Supabase Schema (already applied — do not recreate)

### `categories` table
```sql
id          uuid PRIMARY KEY
name        text NOT NULL
slug        text NOT NULL UNIQUE
description text
image_url   text
parent_id   uuid REFERENCES categories(id)   -- self-referencing
level       smallint (1–4)                   -- 1=gender, 2=division, 3=type, 4=subtype
sort_order  integer
is_active   boolean
created_at  timestamptz
updated_at  timestamptz
```

### `products` table
```sql
id            uuid PRIMARY KEY
name          text NOT NULL
slug          text NOT NULL UNIQUE
description   text
price         numeric(10,2)
sale_price    numeric(10,2)
category_id   uuid REFERENCES categories(id)
gender        text ('men' | 'women' | 'unisex')
sizes         text[]
colors        text[]
images        text[]
thumbnail_url text
in_stock      boolean
stock_count   integer
is_featured   boolean
is_active     boolean
tags          text[]
created_at    timestamptz
updated_at    timestamptz
```

### `product_variants` table
```sql
id          uuid PRIMARY KEY
product_id  uuid REFERENCES products(id) ON DELETE CASCADE
size        text
color       text
stock_count integer
sku         text UNIQUE
created_at  timestamptz
```

### Storage
- Bucket: `product-images` (public read, authenticated write/delete)

### RLS
- Public: SELECT only on active products and categories
- Authenticated (admin): full access to all tables and storage

---

## Category Tree (4 levels, already seeded)

```
Level 1 — Gender:     Men's | Women's
Level 2 — Division:   Clothing | Footwear | Accessories
Level 3 — Type:       Tops | Bottoms | Outerwear | Suits | Sportswear
Level 4 — Subtype:    T-Shirts | Polo Shirts | Dress Shirts | Hoodies | Sweatshirts
                      Jeans | Trousers | Shorts | Chinos | Joggers
```

The `categories` table uses `parent_id` to link levels. When querying for a full tree, recursively join by `parent_id`. Breadcrumb navigation on the storefront walks up the tree to Level 1.

---

## Supabase Client Setup

Use `@supabase/ssr` for all client/server handling:

```ts
// /lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (...args) => { try { cookieStore.setAll(...args) } catch {} } } }
  )
}
```

```ts
// /lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## Auth & Middleware

Protect all `/admin` routes via `/middleware.ts`. Use Supabase session check — redirect unauthenticated users to `/login`. Admin login page uses its own isolated styles (not storefront, not admin chrome). Store session in cookies via `@supabase/ssr`.

---

## Zustand Store (`/hooks/useUiStore.ts`)

```ts
interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}
```

Wire `showToast` to Sonner's `toast()` function.

---

## TypeScript Types (`/types/index.ts`)

```ts
export type Gender = 'men' | 'women' | 'unisex'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  level: 1 | 2 | 3 | 4
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  children?: Category[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  sale_price?: number
  category_id?: string
  category?: Category
  gender?: Gender
  sizes: string[]
  colors: string[]
  images: string[]
  thumbnail_url?: string
  in_stock: boolean
  stock_count: number
  is_featured: boolean
  is_active: boolean
  tags: string[]
  created_at: string
  updated_at: string
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  product_id: string
  size?: string
  color?: string
  stock_count: number
  sku?: string
  created_at: string
}
```

---

## Constants (`/constants/index.ts`)

```ts
export const STORAGE_BUCKET = 'product-images'
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
export const GENDERS = [
  { label: "Men's", value: 'men' },
  { label: "Women's", value: 'women' },
  { label: 'Unisex', value: 'unisex' },
]
export const CATEGORY_LEVELS = { 1: 'Gender', 2: 'Division', 3: 'Type', 4: 'Subtype' }
```

---

## Storefront Pages

### Homepage (`/`)
- Full-height hero: editorial headline (Cormorant Garamond), background image with dark scrim, single outlined CTA
- Featured products grid: 4 columns desktop, 2 mobile. `is_featured = true`
- Shop by category: Level 1 + Level 2 cards with category image, minimal label
- New arrivals strip: horizontal scroll on mobile

### Category page (`/category/[...slug]`)
- Handles any level 1–4 via slug array
- Breadcrumb from current category up to Level 1
- Product grid filtered by category and all descendants
- Sidebar filters: size, color, price range, in-stock toggle — pill tags, accent color when active
- Gender context from Level 1 ancestor — not a separate filter

### Product detail (`/product/[slug]`)
- Left: image gallery — large main image + 4-thumbnail strip below, Framer Motion fade between images
- Right: breadcrumb, name, price (sale price in accent with strikethrough original), color selector, size selector (out-of-stock states), add to cart button (accent filled), description
- Related products: same Level 3 category, 4-card row

---

## Admin CMS Pages

### Dashboard (`/admin/dashboard`)
- `PageHeader`: "Dashboard" title + subtitle on gradient
- Stat cards row: Total Products, Active Products, Out of Stock, Total Categories
- Recent products table (last 10)

### Products list (`/admin/dashboard/products`)
- `PageHeader` with "Add Product" button (primary blue)
- `ProductTable`: thumbnail, name+slug, category, price, stock badge, status badge, edit/delete actions
- Search input + filter by category, gender, stock status
- Pagination

### Add/Edit product
- `PageHeader`: "Add Product" or "Edit Product" + back link
- `ProductForm`: two-column — left (name, slug, description, category cascade, gender, sizes, colors, tags), right (images uploader, price, sale price, stock count, featured toggle, active toggle)
- react-hook-form + zod validation
- Sonner toast on save/error

### Categories (`/admin/dashboard/categories`)
- `PageHeader` with "Add Category" button
- `CategoryTreeView`: expandable tree, all 4 levels, dnd-kit drag-to-reorder siblings, inline edit/delete, add child button per node

---

## Image Upload Logic (`/lib/storage/images.ts`)

```ts
export async function uploadImage(file: File, folder: string): Promise<string>
export async function deleteImage(path: string): Promise<void>
export async function getPublicUrl(path: string): Promise<string>
```

File naming: `{folder}/{uuid}-{sanitized-originalname}` — never use raw user filenames.

---

## Query Patterns

### `/lib/queries/products.ts`
```ts
getProducts(filters?)
getProductBySlug(slug)
getFeaturedProducts()
getProductsByCategory(categoryId, includeDescendants?: boolean)
createProduct(data)
updateProduct(id, data)
deleteProduct(id)
```

### `/lib/queries/categories.ts`
```ts
getCategoryTree()
getCategoriesByLevel(level)
getCategoryBySlug(slug)
getChildCategories(parentId)
createCategory(data)
updateCategory(id, data)
deleteCategory(id)
```

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Conventions

- Server components by default — `'use client'` only for forms, hooks, event handlers
- ISR (`revalidate`) on all storefront pages — not SSR, not fully static
- Dates: `Intl.DateTimeFormat` — no date libraries
- Error handling: try/catch on all Supabase calls, surface via `useUiStore().showToast()`
- Loading states: shadcn `Skeleton` components
- Forms: react-hook-form + zod always
- Images: Next.js `<Image>` with Supabase Storage URLs, always set explicit width/height or fill
- No hardcoded strings — copy in components, config in `/constants/`
- `cn()` utility from `/lib/utils/cn.ts` for all conditional classNames

---

## Start Here

Scaffold in this exact order:

1. Folder structure (all files, empty with comments)
2. `globals.css` with full design token `@theme` block and font imports
3. `/types/index.ts` and `/constants/index.ts`
4. `/lib/utils/cn.ts`, `slugify.ts`, `formatPrice.ts`
5. `/lib/supabase/client.ts` and `server.ts`
6. `/middleware.ts` (auth protection)
7. `/hooks/useUiStore.ts` (Zustand)
8. `/lib/queries/categories.ts` and `products.ts`
9. `/lib/storage/images.ts`
10. Admin login page (isolated styles)
11. Admin shell layout — `AdminSidebar` + `AdminTopNav` + `PageHeader` + `StatCard`
12. Admin dashboard page
13. `CategoryTreeView` + category CRUD pages
14. `ProductTable` + `ProductForm` + `ImageUploader` + product CRUD pages
15. Storefront layout — `Navbar` + `Footer` (Cormorant + DM Sans applied)
16. `Hero` + `ProductCard` + `ProductGrid` + homepage
17. Category page with `CategoryFilter` + `CategoryBreadcrumb`
18. Product detail page with `ProductImageGallery` + `SizeSelector` + `ColorSelector`
