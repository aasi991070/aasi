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

export type CategorySort = "newest" | "price_asc" | "price_desc" | "name_asc";

export interface CategoryProductsOptions {
  page?: number;
  pageSize?: number;
  sort?: CategorySort;
}

export interface CategoryFacets {
  sizes: string[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
}

export interface CategoryProductsResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
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
  stock_count: number;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
}

export type CartStatus = "active" | "converted" | "abandoned";

export type AddressType = "shipping" | "billing";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type OrderPaymentStatus =
  | "unpaid"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface OrderAddressSnapshot {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
}

export interface Cart {
  id: string;
  user_id?: string | null;
  session_id: string;
  status: CartStatus;
  currency: string;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
  items?: CartItem[];
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  qty: number;
  unit_price_snapshot: number;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface Address {
  id: string;
  user_id?: string | null;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
  type: AddressType;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  email: string;
  phone?: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  tax: number;
  total: number;
  currency: string;
  coupon_code?: string | null;
  shipping_address: OrderAddressSnapshot;
  billing_address?: OrderAddressSnapshot | null;
  notes?: string;
  placed_at?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  name_snapshot: string;
  slug_snapshot: string;
  sku_snapshot?: string;
  image_snapshot?: string;
  size?: string;
  color?: string;
  qty: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  created_at: string;
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
