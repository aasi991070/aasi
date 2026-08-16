import { describe, expect, it } from "vitest";
import {
  buildCategoryQueryString,
  buildClearFiltersQueryString,
  hasActiveStorefrontFilters,
  parseCategoryPage,
  parseCategorySort,
  parseStorefrontFilters,
  shouldRefetchCategoryProducts,
} from "@/lib/utils/storefrontFilters";

describe("parseStorefrontFilters", () => {
  it("parses comma-separated filters", () => {
    const params = new URLSearchParams("sizes=M,L&colors=black&inStock=true&page=2");
    expect(parseStorefrontFilters(params)).toEqual({
      sizes: ["M", "L"],
      colors: ["black"],
      minPrice: undefined,
      maxPrice: undefined,
      inStock: true,
      search: undefined,
    });
  });
});

describe("parseCategoryPage", () => {
  it("defaults invalid pages to 1", () => {
    expect(parseCategoryPage(new URLSearchParams("page=0"))).toBe(1);
    expect(parseCategoryPage(new URLSearchParams("page=abc"))).toBe(1);
  });
});

describe("parseCategorySort", () => {
  it("falls back to newest for unknown sort", () => {
    expect(parseCategorySort(new URLSearchParams("sort=unknown"))).toBe("newest");
  });
});

describe("hasActiveStorefrontFilters", () => {
  it("detects active filters", () => {
    expect(hasActiveStorefrontFilters({ sizes: ["M"] })).toBe(true);
    expect(hasActiveStorefrontFilters({})).toBe(false);
  });
});

describe("shouldRefetchCategoryProducts", () => {
  it("refetches when page or sort changes", () => {
    expect(shouldRefetchCategoryProducts(new URLSearchParams("page=2"))).toBe(true);
    expect(shouldRefetchCategoryProducts(new URLSearchParams("sort=price_asc"))).toBe(true);
    expect(shouldRefetchCategoryProducts(new URLSearchParams())).toBe(false);
  });
});

describe("buildCategoryQueryString", () => {
  it("removes default page and sort values", () => {
    const current = new URLSearchParams("page=2&sort=price_asc&sizes=M");
    expect(buildCategoryQueryString(current, { page: "1", sort: "newest" })).toBe(
      "?sizes=M"
    );
  });
});

describe("buildClearFiltersQueryString", () => {
  it("clears filter params but keeps sort", () => {
    const current = new URLSearchParams("sizes=M&sort=price_asc&page=2");
    expect(buildClearFiltersQueryString(current)).toBe("?sort=price_asc");
  });
});
