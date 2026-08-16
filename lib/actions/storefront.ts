"use server";

import { getProductsByCategory } from "@/lib/queries/products";
import type {
  CategoryProductsOptions,
  CategoryProductsResult,
  StorefrontFilters,
} from "@/types";

export async function getFilteredProducts(
  categoryIds: string[],
  filters: StorefrontFilters,
  options: CategoryProductsOptions = {}
): Promise<CategoryProductsResult> {
  return getProductsByCategory(categoryIds, filters, options);
}
