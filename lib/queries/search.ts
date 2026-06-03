import { createClient } from "@/lib/supabase/server";
import { getAllCategories } from "@/lib/queries/categories";
import {
  buildProductSearchText,
  getMatchedFields,
  matchesAllTokens,
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

export async function searchProducts(
  query: string
): Promise<ProductSearchResult[]> {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return [];

  try {
    const supabase = await createClient();
    const allCategories = await getAllCategories(true);

    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .or(
        [
          ...tokens.flatMap((t) => [
            `name.ilike.%${t}%`,
            `slug.ilike.%${t}%`,
            `description.ilike.%${t}%`,
            `gender.ilike.%${t}%`,
          ]),
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const products = (data ?? []).map(mapProduct);

    return products
      .filter((product) => {
        const haystack = buildProductSearchText(product, allCategories);
        return matchesAllTokens(haystack, tokens);
      })
      .map((product) => ({
        product,
        matchedFields: getMatchedFields(product, tokens, allCategories),
      }));
  } catch {
    return [];
  }
}

export async function searchCategories(
  query: string
): Promise<CategorySearchResult[]> {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return [];

  try {
    const supabase = await createClient();
    const allCategories = await getAllCategories(true);

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .or(
        tokens
          .flatMap((t) => [
            `name.ilike.%${t}%`,
            `slug.ilike.%${t}%`,
            `description.ilike.%${t}%`,
          ])
          .join(",")
      )
      .limit(20);

    if (error) throw error;

    return (data ?? [])
      .map((row) => row as Category)
      .filter((category) => {
        const haystack = [category.name, category.slug, category.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return matchesAllTokens(haystack, tokens);
      })
      .map((category) => {
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
  } catch {
    return [];
  }
}
