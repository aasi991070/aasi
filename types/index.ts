export type Gender = "men" | "women" | "unisex";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  level: 1 | 2 | 3 | 4;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  sale_price?: number;
  category_id?: string;
  category?: Category;
  gender?: Gender;
  sizes: string[];
  colors: string[];
  images: string[];
  thumbnail_url?: string;
  in_stock: boolean;
  stock_count: number;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size?: string;
  color?: string;
  stock_count: number;
  sku?: string;
  created_at: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  gender?: Gender;
  inStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  page?: number;
  pageSize?: number;
}

export interface StorefrontFilters {
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

/**
 * Public shape of a review. Deliberately has no `ip_hash` — that column is
 * never selected outside the moderation queue.
 */
export interface ProductReview {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  order_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
}

export interface ProductSearchResult {
  product: Product;
  matchedFields: string[];
}

export interface CategorySearchResult {
  category: Category;
  href: string;
  matchedFields: string[];
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  level: 1 | 2 | 3 | 4;
  sort_order: number;
  is_active: boolean;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description?: string;
  price: number;
  sale_price?: number;
  category_id?: string;
  gender?: Gender;
  sizes: string[];
  colors: string[];
  images: string[];
  thumbnail_url?: string;
  in_stock: boolean;
  stock_count: number;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  totalCategories: number;
}

export interface SiteSettings {
  monochrome_enabled: boolean;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_label: string;
  hero_cta_href: string;
  hero_image_url: string;
}
