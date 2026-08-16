import { unstable_cache } from "next/cache";
import { assertOk } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getAllCategories } from "@/lib/queries/categories";
import { PRODUCTS_PAGE_SIZE, REVALIDATE_SECONDS } from "@/constants";
import {
  buildIlikeOrFilter,
  buildProductSearchText,
  matchesAllTokens,
  PRODUCT_SEARCH_FIELDS,
  tokenizeQuery,
} from "@/lib/utils/searchText";
import type {
  DashboardStats,
  Product,
  ProductFilters,
  ProductFormData,
  StorefrontFilters,
} from "@/types";

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
    const orClause = buildIlikeOrFilter(
      tokenizeQuery(filters.search),
      PRODUCT_SEARCH_FIELDS
    );
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
  assertOk("products.list", { data, error });

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
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Tagged per slug as well as globally, so editing one product does not
  // have to purge every other PDP.
  return cachedProductQuery(
    "products:by-slug",
    async (s: string) => {
      const supabase = createPublicClient();
      const data = assertOk(
        "products.bySlug",
        await supabase
          .from("products")
          .select("*, category:categories(*), variants:product_variants(*)")
          .eq("slug", s)
          .eq("is_active", true)
          .maybeSingle()
      );

      // null here means no such active product — a real answer, not a failure.
      return data ? mapProduct(data) : null;
    },
    [`product:${slug}`]
  )(slug);
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const data = assertOk(
    "products.byId",
    await supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .eq("id", id)
      .maybeSingle()
  );

  return data ? mapProduct(data) : null;
}

export const getFeaturedProducts = cachedProductQuery(
  "products:featured",
  async (limit: number = 8): Promise<Product[]> => {
    const supabase = createPublicClient();
    const data = assertOk(
      "products.featured",
      await supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit)
    );

    return (data ?? []).map(mapProduct);
  }
);

export async function getRecentProducts(limit = 10): Promise<Product[]> {
  const supabase = await createClient();
  const data = assertOk(
    "products.recent",
    await supabase
      .from("products")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: false })
      .limit(limit)
  );

  return (data ?? []).map(mapProduct);
}

export const getNewArrivals = cachedProductQuery(
  "products:new-arrivals",
  async (limit: number = 12): Promise<Product[]> => {
    const supabase = createPublicClient();
    const data = assertOk(
      "products.newArrivals",
      await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit)
    );

    return (data ?? []).map(mapProduct);
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

    const data = assertOk("products.byCategory", await query);
    return (data ?? []).map(mapProduct);
  }
);

export async function getProductsByCategory(
  categoryIds: string[],
  storefrontFilters: StorefrontFilters = {}
): Promise<Product[]> {
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
    const category = assertOk(
      "products.related.category",
      await supabase
        .from("categories")
        .select("parent_id")
        .eq("id", categoryId)
        .maybeSingle()
    );

    let level3Id = categoryId;
    if (category?.parent_id) {
      const parent = assertOk(
        "products.related.parent",
        await supabase
          .from("categories")
          .select("id, level, parent_id")
          .eq("id", category.parent_id)
          .maybeSingle()
      );

      if (parent?.level === 3) {
        level3Id = parent.id;
      } else if (parent?.parent_id) {
        const grandparent = assertOk(
          "products.related.grandparent",
          await supabase
            .from("categories")
            .select("id, level")
            .eq("id", parent.parent_id)
            .maybeSingle()
        );
        if (grandparent?.level === 3) level3Id = grandparent.id;
      }
    }

    const siblingCategories = assertOk(
      "products.related.siblings",
      await supabase
        .from("categories")
        .select("id")
        .or(`id.eq.${level3Id},parent_id.eq.${level3Id}`)
    );

    const categoryIds = (siblingCategories ?? []).map((c) => c.id);

    const data = assertOk(
      "products.related",
      await supabase
        .from("products")
        .select("*")
        .in("category_id", categoryIds)
        .eq("is_active", true)
        .neq("id", productId)
        .limit(limit)
    );

    return (data ?? []).map(mapProduct);
  }
);

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  if (!product.category_id) return [];
  return fetchRelatedProducts(product.id, product.category_id, limit);
}

export async function getDashboardStats(): Promise<DashboardStats> {
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

  assertOk("products.stats.total", totalRes);
  assertOk("products.stats.active", activeRes);
  assertOk("products.stats.outOfStock", oosRes);
  assertOk("products.stats.categories", catRes);

  return {
    totalProducts: totalRes.count ?? 0,
    activeProducts: activeRes.count ?? 0,
    outOfStock: oosRes.count ?? 0,
    totalCategories: catRes.count ?? 0,
  };
}

export async function createProduct(data: ProductFormData): Promise<Product> {
  const supabase = await createClient();
  const created = assertOk(
    "products.create",
    await supabase.from("products").insert(data).select().single()
  );

  return mapProduct(created);
}

export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>
): Promise<Product> {
  const supabase = await createClient();
  const updated = assertOk(
    "products.update",
    await supabase
      .from("products")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
  );

  return mapProduct(updated);
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient();
  assertOk(
    "products.delete",
    await supabase.from("products").delete().eq("id", id)
  );
}

export async function getAllActiveProductSlugs(): Promise<string[]> {
  return cachedProductQuery("products:active-slugs", async () => {
    const supabase = createPublicClient();
    const data = assertOk(
      "products.activeSlugs",
      await supabase.from("products").select("slug").eq("is_active", true)
    );

    return (data ?? []).map((row) => String(row.slug));
  })();
}
