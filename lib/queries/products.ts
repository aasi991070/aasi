import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getAllCategories } from "@/lib/queries/categories";
import { PRODUCTS_PAGE_SIZE, REVALIDATE_SECONDS } from "@/constants";
import {
  buildProductSearchText,
  matchesAllTokens,
  tokenizeQuery,
} from "@/lib/utils/searchText";
import type {
  DashboardStats,
  Product,
  ProductFilters,
  ProductFormData,
  StorefrontFilters,
} from "@/types";

function buildAdminSearchOr(search: string): string {
  const tokens = tokenizeQuery(search);
  if (!tokens.length) return "";

  return tokens
    .flatMap((t) => [
      `name.ilike.%${t}%`,
      `slug.ilike.%${t}%`,
      `description.ilike.%${t}%`,
      `gender.ilike.%${t}%`,
    ])
    .join(",");
}

/**
 * Anonymous storefront reads are cached under the `products` tag (plus a
 * per-slug tag for PDPs) and go through the cookie-free client — `cookies()`
 * cannot appear inside `unstable_cache` on Next 14. Admin reads need to see
 * inactive rows, so they stay on the session client, uncached.
 */
const PRODUCTS_TAG = "products";

function cachedProductQuery<TArgs extends unknown[], TResult>(
  keyPrefix: string,
  fn: (...args: TArgs) => Promise<TResult>,
  extraTags: string[] = []
) {
  return (...args: TArgs) =>
    unstable_cache(() => fn(...args), [keyPrefix, JSON.stringify(args)], {
      tags: [PRODUCTS_TAG, ...extraTags],
      revalidate: REVALIDATE_SECONDS,
    })();
}

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

export async function getProducts(
  filters: ProductFilters = {}
): Promise<{ products: Product[]; total: number }> {
  try {
    const supabase = await createClient();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? PRODUCTS_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products")
      .select("*, category:categories(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters.search) {
      const orClause = buildAdminSearchOr(filters.search);
      if (orClause) query = query.or(orClause);
    }
    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters.gender) {
      query = query.eq("gender", filters.gender);
    }
    if (filters.inStock !== undefined) {
      query = query.eq("in_stock", filters.inStock);
    }
    if (filters.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }
    if (filters.isFeatured !== undefined) {
      query = query.eq("is_featured", filters.isFeatured);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    let products = (data ?? []).map(mapProduct);

    if (filters.search) {
      const tokens = tokenizeQuery(filters.search);
      const allCategories = await getAllCategories();
      products = products.filter((p) =>
        matchesAllTokens(buildProductSearchText(p, allCategories), tokens)
      );
    }

    return {
      products,
      total: filters.search ? products.length : (count ?? 0),
    };
  } catch {
    return { products: [], total: 0 };
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    // Tagged per slug as well as globally, so editing one product does not
    // have to purge every other PDP.
    return await cachedProductQuery(
      "products:by-slug",
      async (s: string) => {
        const supabase = createPublicClient();
        const { data, error } = await supabase
          .from("products")
          .select("*, category:categories(*), variants:product_variants(*)")
          .eq("slug", s)
          .eq("is_active", true)
          .maybeSingle();

        if (error) throw error;
        return data ? mapProduct(data) : null;
      },
      [`product:${slug}`]
    )(slug);
  } catch {
    return null;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapProduct(data) : null;
  } catch {
    return null;
  }
}

export const getFeaturedProducts = cachedProductQuery(
  "products:featured",
  async (limit: number = 8): Promise<Product[]> => {
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(mapProduct);
    } catch {
      return [];
    }
  }
);

export async function getRecentProducts(limit = 10): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map(mapProduct);
  } catch {
    return [];
  }
}

export const getNewArrivals = cachedProductQuery(
  "products:new-arrivals",
  async (limit: number = 12): Promise<Product[]> => {
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(mapProduct);
    } catch {
      return [];
    }
  }
);

/**
 * Only the database round trip is cached. The in-memory filtering below stays
 * outside, because the search branch calls `getAllCategories`, which is itself
 * cached — nesting one `unstable_cache` inside another buys nothing and makes
 * the keys harder to reason about.
 */
const fetchCategoryProducts = cachedProductQuery(
  "products:by-category",
  async (
    categoryIds: string[],
    inStock: boolean,
    minPrice: number | null,
    maxPrice: number | null
  ): Promise<Product[]> => {
    const supabase = createPublicClient();
    let query = supabase
      .from("products")
      .select("*")
      .in("category_id", categoryIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (inStock) {
      query = query.eq("in_stock", true);
    }
    if (minPrice != null) {
      query = query.gte("price", minPrice);
    }
    if (maxPrice != null) {
      query = query.lte("price", maxPrice);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  }
);

export async function getProductsByCategory(
  categoryIds: string[],
  storefrontFilters: StorefrontFilters = {}
): Promise<Product[]> {
  try {
    let products = await fetchCategoryProducts(
      categoryIds,
      storefrontFilters.inStock === true,
      storefrontFilters.minPrice ?? null,
      storefrontFilters.maxPrice ?? null
    );

    if (storefrontFilters.sizes?.length) {
      products = products.filter((p) =>
        storefrontFilters.sizes!.some((size) => p.sizes.includes(size))
      );
    }
    if (storefrontFilters.colors?.length) {
      products = products.filter((p) =>
        storefrontFilters.colors!.some((color) =>
          p.colors.some((c) => c.toLowerCase() === color.toLowerCase())
        )
      );
    }

    if (storefrontFilters.search) {
      const tokens = tokenizeQuery(storefrontFilters.search);
      const allCategories = await getAllCategories(true);
      products = products.filter((p) =>
        matchesAllTokens(buildProductSearchText(p, allCategories), tokens)
      );
    }

    return products;
  } catch {
    return [];
  }
}

/**
 * Keyed on the ids it actually depends on rather than the whole product, so
 * the cache key stays small and stable across unrelated field edits.
 * Prompt 16 replaces the walk up the tree with an in-memory lookup.
 */
const fetchRelatedProducts = cachedProductQuery(
  "products:related",
  async (
    productId: string,
    categoryId: string,
    limit: number
  ): Promise<Product[]> => {
    const supabase = createPublicClient();
    const { data: category } = await supabase
      .from("categories")
      .select("parent_id")
      .eq("id", categoryId)
      .maybeSingle();

    let level3Id = categoryId;
    if (category?.parent_id) {
      const { data: parent } = await supabase
        .from("categories")
        .select("id, level, parent_id")
        .eq("id", category.parent_id)
        .maybeSingle();

      if (parent?.level === 3) {
        level3Id = parent.id;
      } else if (parent?.parent_id) {
        const { data: grandparent } = await supabase
          .from("categories")
          .select("id, level")
          .eq("id", parent.parent_id)
          .maybeSingle();
        if (grandparent?.level === 3) level3Id = grandparent.id;
      }
    }

    const { data: siblingCategories } = await supabase
      .from("categories")
      .select("id")
      .or(`id.eq.${level3Id},parent_id.eq.${level3Id}`);

    const categoryIds = (siblingCategories ?? []).map((c) => c.id);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("category_id", categoryIds)
      .eq("is_active", true)
      .neq("id", productId)
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map(mapProduct);
  }
);

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  if (!product.category_id) return [];

  try {
    return await fetchRelatedProducts(product.id, product.category_id, limit);
  } catch {
    return [];
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient();

    const [totalRes, activeRes, oosRes, catRes] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("in_stock", false),
      supabase.from("categories").select("*", { count: "exact", head: true }),
    ]);

    return {
      totalProducts: totalRes.count ?? 0,
      activeProducts: activeRes.count ?? 0,
      outOfStock: oosRes.count ?? 0,
      totalCategories: catRes.count ?? 0,
    };
  } catch {
    return {
      totalProducts: 0,
      activeProducts: 0,
      outOfStock: 0,
      totalCategories: 0,
    };
  }
}

export async function createProduct(
  data: ProductFormData
): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from("products")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return mapProduct(created);
  } catch {
    return null;
  }
}

export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>
): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("products")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapProduct(updated);
  } catch {
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}
