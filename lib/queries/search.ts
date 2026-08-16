import { assertOk } from "@/lib/errors";
import { createPublicClient } from "@/lib/supabase/public";
import { getAllCategories } from "@/lib/queries/categories";
import {
  getMatchedFields,
  MAX_QUERY_LENGTH,
  tokenizeQuery,
} from "@/lib/utils/searchText";
import { getCategoryHref, getCategoryBreadcrumbPath } from "@/lib/utils/getGenderCategory";
import type {
  Category,
  CategorySearchResult,
  Product,
  ProductSearchResult,
} from "@/types";

function mapProduct(row: Record<string, unknown>): Product {
  const base = row as unknown as Product;
  return {
    ...base,
    price: Number(row.price),
    sale_price: row.sale_price != null ? Number(row.sale_price) : undefined,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    colors: Array.isArray(row.colors) ? (row.colors as string[]) : [],
    sizes: Array.isArray(row.sizes) ? (row.sizes as string[]) : [],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
  };
}

function attachCategory(
  product: Product,
  allCategories: Category[]
): Product {
  if (!product.category_id) return product;
  const category = allCategories.find(
    (entry) => entry.id === product.category_id
  );
  return category ? { ...product, category } : product;
}

export async function searchProducts(
  query: string
): Promise<ProductSearchResult[]> {
  const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH);
  const tokens = tokenizeQuery(trimmed);
  if (!tokens.length) return [];

  const supabase = createPublicClient();
  const allCategories = await getAllCategories(true);

  const data = assertOk(
    "search.products",
    await supabase.rpc("search_products", { q: trimmed, lim: 40 })
  );

  return ((data ?? []) as Record<string, unknown>[])
    .map((row) => attachCategory(mapProduct(row), allCategories))
    .map((product: Product) => ({
      product,
      matchedFields: getMatchedFields(product, tokens, allCategories),
    }));
}

export async function searchCategories(
  query: string
): Promise<CategorySearchResult[]> {
  const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH);
  const tokens = tokenizeQuery(trimmed);
  if (!tokens.length) return [];

  const supabase = createPublicClient();
  const allCategories = await getAllCategories(true);

  const data = assertOk(
    "search.categories",
    await supabase.rpc("search_categories", { q: trimmed, lim: 20 })
  );

  return ((data ?? []) as Category[])
    .map((category: Category) => {
      const path = getCategoryBreadcrumbPath(category.id, allCategories);
      const matchedFields: string[] = [];
      if (tokens.some((t) => category.name.toLowerCase().includes(t)))
        matchedFields.push("name");
      if (tokens.some((t) => category.slug.toLowerCase().includes(t)))
        matchedFields.push("slug");
      if (
        category.description &&
        tokens.some((t) => category.description!.toLowerCase().includes(t))
      )
        matchedFields.push("description");

      return {
        category,
        href: getCategoryHref(path.length ? path : [category]),
        matchedFields,
      };
    });
}
