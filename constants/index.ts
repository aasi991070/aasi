import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Settings,
  Home,
  ShoppingBag,
  Shirt,
  Footprints,
} from "lucide-react";

export const STORAGE_BUCKET = "product-images";

export const BRAND_NAME = "Aasi";
export const BRAND_ADMIN_NAME = "Aasi CMS";
export const BRAND_TAGLINE = "Luxury Clothing";
export const BRAND_LOGO_PATH = "/logo.png";

export const CURRENCY_CODE = "INR";
export const CURRENCY_LOCALE = "en-IN";

export const DEFAULT_HERO = {
  hero_title: "Timeless Craft, Modern Silhouette",
  hero_subtitle: "Discover our curated collection of luxury essentials",
  hero_cta_label: "Explore Collection",
  hero_cta_href: "/category/mens",
  hero_image_url:
    "https://images.unsplash.com/photo-1441984904996-e0b46a68737d?w=1920&q=80",
} as const;

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export const GENDERS = [
  { label: "Men's", value: "men" as const },
  { label: "Women's", value: "women" as const },
  { label: "Unisex", value: "unisex" as const },
];

export const CATEGORY_LEVELS = {
  1: "Gender",
  2: "Division",
  3: "Type",
  4: "Subtype",
} as const;

export const REVALIDATE_SECONDS = 3600;

export const PRODUCTS_PAGE_SIZE = 20;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section?: string;
}

/** @deprecated Use NavItem */
export type AdminNavItem = NavItem;

export const STOREFRONT_NAV_ITEMS: NavItem[] = [
  {
    section: "Shop",
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    section: "Shop",
    label: "Men",
    href: "/category/mens",
    icon: Shirt,
  },
  {
    section: "Shop",
    label: "Women",
    href: "/category/womens",
    icon: ShoppingBag,
  },
  {
    section: "Shop",
    label: "Footwear",
    href: "/category/mens/footwear",
    icon: Footprints,
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    section: "Overview",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    section: "Catalog",
    label: "Products",
    href: "/admin/dashboard/products",
    icon: Package,
  },
  {
    section: "Catalog",
    label: "Categories",
    href: "/admin/dashboard/categories",
    icon: FolderTree,
  },
  {
    section: "System",
    label: "Settings",
    href: "/admin/dashboard/settings",
    icon: Settings,
  },
];

export const COLOR_MAP: Record<string, string> = {
  black: "#0f0f0f",
  white: "#ffffff",
  navy: "#1e3a8a",
  beige: "#d4c4a8",
  grey: "#9ca3af",
  gray: "#9ca3af",
  brown: "#78350f",
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
};
