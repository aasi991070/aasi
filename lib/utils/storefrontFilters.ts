import type { StorefrontFilters } from "@/types";

export function parseStorefrontFilters(
  params: URLSearchParams
): StorefrontFilters {
  return {
    sizes: params.get("sizes")?.split(",").filter(Boolean),
    colors: params.get("colors")?.split(",").filter(Boolean),
    minPrice: params.get("minPrice")
      ? Number(params.get("minPrice"))
      : undefined,
    maxPrice: params.get("maxPrice")
      ? Number(params.get("maxPrice"))
      : undefined,
    inStock: params.get("inStock") === "true",
    search: params.get("search")?.trim() || undefined,
  };
}

export function hasActiveStorefrontFilters(
  filters: StorefrontFilters
): boolean {
  return Boolean(
    filters.sizes?.length ||
      filters.colors?.length ||
      filters.inStock ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.search
  );
}
