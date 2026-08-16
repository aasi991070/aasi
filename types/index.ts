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
  meta_title?: string;
  meta_description?: string;
  image_alts?: string[];
  tax_rate?: number;
  hsn_code?: string;
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
  price_override?: number;
  is_enabled: boolean;
  created_at: string;
}

export interface VariantFormInput {
  id?: string;
  size: string;
  color: string;
  stock_count: number;
  sku?: string;
  price_override?: number | null;
  is_enabled: boolean;
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
  meta_title?: string;
  meta_description?: string;
  image_alts?: string[];
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

export interface CartLineFlags {
  priceChanged: boolean;
  stockReduced: boolean;
  qtyClamped: boolean;
}

export interface CartItemView extends CartItem {
  currentUnitPrice: number;
  availableStock: number;
  lineTotal: number;
  flags: CartLineFlags;
}

export interface CartSummary extends Cart {
  items: CartItemView[];
  subtotal: number;
  discount: number;
  itemCount: number;
  couponCode?: string | null;
  messages: string[];
}

export type CartErrorCode =
  | "NOT_FOUND"
  | "PRODUCT_INACTIVE"
  | "VARIANT_MISMATCH"
  | "OUT_OF_STOCK"
  | "CART_FULL"
  | "INVALID_COUPON"
  | "INVALID_INPUT"
  | "UNKNOWN";

export interface CartError {
  code: CartErrorCode;
  message: string;
}

export type CartActionResult =
  | { ok: true; cart: CartSummary }
  | { ok: false; error: CartError };

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

export type PaymentProvider = "razorpay";

export type PaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface Payment {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_order_id?: string | null;
  provider_payment_id?: string | null;
  provider_signature?: string | null;
  amount: number;
  status: PaymentStatus;
  raw_payload?: Record<string, unknown> | null;
  created_at: string;
}

export type InventoryMoveReason =
  | "order"
  | "cancel"
  | "return"
  | "manual"
  | "restock";

export interface InventoryMove {
  id: string;
  product_id: string;
  variant_id?: string | null;
  delta: number;
  reason: InventoryMoveReason;
  order_id?: string | null;
  note?: string | null;
  created_at: string;
}

export type CouponType = "percent" | "fixed";

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  min_subtotal: number;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  used_count: number;
  is_active: boolean;
}

export interface ShippingRate {
  id: string;
  code: string;
  label: string;
  amount: number;
  free_above?: number | null;
  sort_order: number;
  is_active: boolean;
}

export type CheckoutErrorCode =
  | "EMPTY_CART"
  | "STOCK_CHANGED"
  | "INVALID_COUPON"
  | "INVALID_INPUT"
  | "UNKNOWN";

export interface CheckoutStockIssue {
  itemId: string;
  productName: string;
  reason: string;
}

export interface CheckoutError {
  code: CheckoutErrorCode;
  message: string;
  items?: CheckoutStockIssue[];
}

export type CheckoutActionResult =
  | { ok: true; data: { orderId: string; orderNumber: string; total: number } }
  | { ok: false; error: CheckoutError };

export interface CheckoutFormState {
  contact: {
    email: string;
    phone: string;
  };
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: "IN";
    phone: string;
  };
  shippingRateId: string;
  saveAddress: boolean;
  selectedAddressId?: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  carrier?: string | null;
  awb?: string | null;
  status?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  totalCategories: number;
}

export interface SalesMetricsWindow {
  today: number;
  last_7d: number;
  last_30d: number;
}

export interface SalesTopProduct {
  name: string;
  product_id?: string | null;
  units: number;
  revenue: number;
}

export interface LowStockVariant {
  variant_id: string;
  product_id: string;
  product_name: string;
  size?: string | null;
  color?: string | null;
  stock_count: number;
}

export interface SalesMetrics {
  revenue: SalesMetricsWindow;
  orders: SalesMetricsWindow;
  aov: SalesMetricsWindow;
  top_by_units: SalesTopProduct[];
  top_by_revenue: SalesTopProduct[];
  low_stock_variants: LowStockVariant[];
  pending_reviews: number;
  catalog: DashboardStats;
}

export type OrderEventType = "status_change" | "note" | "refund" | "shipment";

export interface OrderEvent {
  id: string;
  order_id: string;
  actor_id?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  event_type: OrderEventType;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  email: string;
  phone?: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  total: number;
  created_at: string;
  item_count: number;
}

export type OrderActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: { code: string; message: string } };

export interface RefundLineInput {
  orderItemId: string;
  qty: number;
}

export interface SiteSettings {
  monochrome_enabled: boolean;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_label: string;
  hero_cta_href: string;
  hero_image_url: string;
}
