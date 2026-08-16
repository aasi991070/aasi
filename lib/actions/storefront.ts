"use server";

import { getProductsByCategory } from "@/lib/queries/products";
import type { Product, StorefrontFilters } from "@/types";

export async function getFilteredProducts(
  categoryIds: string[],
  filters: StorefrontFilters
): Promise<Product[]> {
  return getProductsByCategory(categoryIds, filters);
}
