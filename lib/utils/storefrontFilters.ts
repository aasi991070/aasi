import type { CategorySort, StorefrontFilters } from "@/types";

const CATEGORY_SORTS: CategorySort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
];

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

export function parseCategoryPage(params: URLSearchParams): number {
  const page = Number(params.get("page"));
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function parseCategorySort(params: URLSearchParams): CategorySort {
  const sort = params.get("sort");
  if (sort && CATEGORY_SORTS.includes(sort as CategorySort)) {
    return sort as CategorySort;
  }
  return "newest";
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

export function shouldRefetchCategoryProducts(
  params: URLSearchParams
): boolean {
  return (
    hasActiveStorefrontFilters(parseStorefrontFilters(params)) ||
    parseCategoryPage(params) > 1 ||
    parseCategorySort(params) !== "newest"
  );
}

export function buildCategoryQueryString(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>
): string {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") {
      next.delete(key);
      continue;
    }
    if (key === "page" && value === "1") {
      next.delete(key);
      continue;
    }
    if (key === "sort" && value === "newest") {
      next.delete(key);
      continue;
    }
    next.set(key, value);
  }

  const query = next.toString();
  return query ? `?${query}` : "";
}

export function buildClearFiltersQueryString(
  current: URLSearchParams
): string {
  const next = new URLSearchParams(current.toString());
  next.delete("sizes");
  next.delete("colors");
  next.delete("minPrice");
  next.delete("maxPrice");
  next.delete("inStock");
  next.delete("page");
  const query = next.toString();
  return query ? `?${query}` : "";
}
