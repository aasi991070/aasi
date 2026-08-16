import { unstable_cache } from "next/cache";
import { assertOk } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getAllCategories } from "@/lib/queries/categories";
import { PRODUCTS_PAGE_SIZE, REVALIDATE_SECONDS } from "@/constants";
import {
  MAX_QUERY_LENGTH,
  tokenizeQuery,
} from "@/lib/utils/searchText";
import { parseProductRow } from "@/lib/schemas/product";
import type {
  CategoryFacets,
  CategoryProductsOptions,
  CategoryProductsResult,
  CategorySort,
  DashboardStats,
  LowStockVariant,
  Product,
  ProductFilters,
  ProductFormData,
  ProductVariant,
  SalesMetrics,
  SalesMetricsWindow,
  SalesTopProduct,
  StorefrontFilters,
  VariantFormInput,
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

function mapVariant(row: Record<string, unknown>): ProductVariant {
  return {
    id: String(row.id),
    product_id: String(row.product_id),
    size: row.size != null ? String(row.size) : undefined,
    color: row.color != null ? String(row.color) : undefined,
    stock_count: Number(row.stock_count ?? 0),
    sku: row.sku != null ? String(row.sku) : undefined,
    price_override:
      row.price_override != null ? Number(row.price_override) : undefined,
    is_enabled: row.is_enabled !== false,
    created_at: String(row.created_at),
  };
}

export function mapProductRow(
  row: Record<string, unknown>,
  options?: { storefront?: boolean }
): Product {
  const parsed = parseProductRow(row);
  const variants = parsed.variants
    ?.map((variant) =>
      mapVariant(variant as unknown as Record<string, unknown>)
    )
    .filter((variant) => !options?.storefront || variant.is_enabled);

  return {
    id: parsed.id,
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description ?? undefined,
    price: Number(parsed.price),
    sale_price:
      parsed.sale_price != null ? Number(parsed.sale_price) : undefined,
    category_id: parsed.category_id ?? undefined,
    gender: parsed.gender ?? undefined,
    sizes: parsed.sizes,
    colors: parsed.colors,
    images: parsed.images,
    thumbnail_url: parsed.thumbnail_url ?? undefined,
    in_stock: parsed.in_stock,
    stock_count: parsed.stock_count,
    is_featured: parsed.is_featured,
    is_active: parsed.is_active,
    tags: parsed.tags,
    meta_title: parsed.meta_title ?? undefined,
    meta_description: parsed.meta_description ?? undefined,
    image_alts: parsed.image_alts ?? [],
    tax_rate: parsed.tax_rate,
    hsn_code: parsed.hsn_code ?? undefined,
    created_at: parsed.created_at,
    updated_at: parsed.updated_at,
    variants,
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

  if (filters.search) {
    const trimmed = filters.search.trim().slice(0, MAX_QUERY_LENGTH);
    const tokens = tokenizeQuery(trimmed);
    if (!tokens.length) {
      return { products: [], total: 0 };
    }

    const data = assertOk(
      "products.search",
      await supabase.rpc("search_products", { q: trimmed, lim: 100 })
    );

    let products = ((data ?? []) as Record<string, unknown>[]).map((row) => mapProductRow(row));

    if (filters.categoryId) {
      products = products.filter(
        (product: Product) => product.category_id === filters.categoryId
      );
    }
    if (filters.gender) {
      products = products.filter(
        (product: Product) => product.gender === filters.gender
      );
    }
    if (filters.inStock !== undefined) {
      products = products.filter(
        (product: Product) => product.in_stock === filters.inStock
      );
    }
    if (filters.isActive !== undefined) {
      products = products.filter(
        (product: Product) => product.is_active === filters.isActive
      );
    }
    if (filters.isFeatured !== undefined) {
      products = products.filter(
        (product: Product) => product.is_featured === filters.isFeatured
      );
    }

    const total = products.length;
    return {
      products: products.slice(from, to + 1),
      total,
    };
  }

  let query = supabase
    .from("products")
    .select("*, category:categories(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

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

  return {
    products: (data ?? []).map((row) => mapProductRow(row)),
    total: count ?? 0,
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
      return data ? mapProductRow(data, { storefront: true }) : null;
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

  return data ? mapProductRow(data) : null;
}

export async function getVariantsByProductId(
  productId: string
): Promise<ProductVariant[]> {
  const supabase = await createClient();
  const data = assertOk(
    "products.variantsByProductId",
    await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("size")
      .order("color")
  );

  return (data ?? []).map(mapVariant);
}

function isMissingSaveVariantsRpc(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST202" ||
    error.message?.includes("save_product_variants")
  );
}

async function saveProductVariantsFallback(
  productId: string,
  variants: VariantFormInput[]
): Promise<void> {
  const supabase = await createClient();
  const keptKeys = new Set(
    variants.map((variant) => `${variant.size}::${variant.color.toLowerCase()}`)
  );

  for (const variant of variants) {
    const payload = {
      product_id: productId,
      size: variant.size,
      color: variant.color.toLowerCase(),
      stock_count: variant.stock_count,
      sku: variant.sku || null,
      price_override: variant.price_override ?? null,
      is_enabled: variant.is_enabled,
    };

    if (variant.id) {
      assertOk(
        "products.variants.update",
        await supabase
          .from("product_variants")
          .update(payload)
          .eq("id", variant.id)
          .eq("product_id", productId)
      );
      continue;
    }

    const existing = assertOk(
      "products.variants.lookup",
      await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", productId)
        .eq("size", variant.size)
        .eq("color", variant.color.toLowerCase())
        .maybeSingle()
    );

    if (existing?.id) {
      assertOk(
        "products.variants.updateByKey",
        await supabase
          .from("product_variants")
          .update(payload)
          .eq("id", existing.id)
      );
    } else {
      assertOk(
        "products.variants.insert",
        await supabase.from("product_variants").insert(payload)
      );
    }
  }

  const staleRows = assertOk(
    "products.variants.listForProduct",
    await supabase
      .from("product_variants")
      .select("id, size, color")
      .eq("product_id", productId)
  );

  for (const row of staleRows ?? []) {
    const key = `${String(row.size)}::${String(row.color).toLowerCase()}`;
    if (keptKeys.has(key)) continue;

    const variantId = String(row.id);
    const orderRefs = assertOk(
      "products.variants.orderRefs",
      await supabase
        .from("order_items")
        .select("id")
        .eq("variant_id", variantId)
        .limit(1)
    );

    if ((orderRefs ?? []).length) {
      assertOk(
        "products.variants.softDisable",
        await supabase
          .from("product_variants")
          .update({ is_enabled: false, stock_count: 0 })
          .eq("id", variantId)
      );
    } else {
      assertOk(
        "products.variants.delete",
        await supabase.from("product_variants").delete().eq("id", variantId)
      );
    }
  }

  const enabledRows = assertOk(
    "products.variants.sumStock",
    await supabase
      .from("product_variants")
      .select("stock_count")
      .eq("product_id", productId)
      .eq("is_enabled", true)
  );

  const stockTotal = (enabledRows ?? []).reduce(
    (sum, row) => sum + Number(row.stock_count ?? 0),
    0
  );

  assertOk(
    "products.variants.syncStock",
    await supabase
      .from("products")
      .update({ stock_count: stockTotal, updated_at: new Date().toISOString() })
      .eq("id", productId)
  );
}

export async function saveProductVariants(
  productId: string,
  variants: VariantFormInput[]
): Promise<void> {
  const supabase = await createClient();
  const payload = variants.map((variant) => ({
    id: variant.id ?? null,
    size: variant.size,
    color: variant.color.toLowerCase(),
    stock_count: variant.stock_count,
    sku: variant.sku ?? null,
    price_override: variant.price_override ?? null,
    is_enabled: variant.is_enabled,
  }));

  const { error } = await supabase.rpc("save_product_variants", {
    p_product_id: productId,
    p_variants: payload,
  });

  if (error) {
    if (isMissingSaveVariantsRpc(error)) {
      console.warn(
        "[products] save_product_variants RPC missing — falling back to sequential writes until migration 010 runs",
        error.message
      );
      await saveProductVariantsFallback(productId, variants);
      return;
    }

    assertOk("products.variants.save", { data: null, error });
  }
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

    return (data ?? []).map((row) => mapProductRow(row));
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

  return (data ?? []).map((row) => mapProductRow(row));
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

    return (data ?? []).map((row) => mapProductRow(row));
  }
);

/**
 * Distinct sizes, colours, and price bounds for the category filter sidebar.
 * Separate from the paginated product query so facets stay stable across pages.
 */
function isMissingCategoryFacetsRpc(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST202" ||
    error.message?.includes("category_facets")
  );
}

async function getCategoryFacetsFallback(
  categoryIds: string[]
): Promise<CategoryFacets> {
  const supabase = createPublicClient();
  const data = assertOk(
    "products.categoryFacetsFallback",
    await supabase
      .from("products")
      .select("sizes, colors, price, sale_price")
      .in("category_id", categoryIds)
      .eq("is_active", true)
  );

  const sizes = new Set<string>();
  const colors = new Set<string>();
  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    for (const size of (row.sizes as string[] | null) ?? []) {
      sizes.add(size);
    }
    for (const color of (row.colors as string[] | null) ?? []) {
      colors.add(color);
    }

    const effective =
      row.sale_price != null
        ? Number(row.sale_price)
        : Number(row.price);

    if (Number.isFinite(effective)) {
      minPrice = minPrice == null ? effective : Math.min(minPrice, effective);
      maxPrice = maxPrice == null ? effective : Math.max(maxPrice, effective);
    }
  }

  return {
    sizes: Array.from(sizes).sort(),
    colors: Array.from(colors).sort(),
    minPrice,
    maxPrice,
  };
}

export async function getCategoryFacets(
  categoryIds: string[]
): Promise<CategoryFacets> {
  if (!categoryIds.length) {
    return { sizes: [], colors: [], minPrice: null, maxPrice: null };
  }

  return cachedProductQuery(
    "products:category-facets",
    async (ids: string[]): Promise<CategoryFacets> => {
      const supabase = createPublicClient();
      const { data, error } = await supabase.rpc("category_facets", {
        category_ids: ids,
      });

      if (error) {
        if (isMissingCategoryFacetsRpc(error)) {
          console.warn(
            "[products] category_facets RPC missing — falling back to product aggregation until migrations run",
            error.message
          );
          return getCategoryFacetsFallback(ids);
        }
        assertOk("products.categoryFacets", { data, error });
      }

      const row = ((data ?? []) as Record<string, unknown>[])[0];
      if (!row) {
        return { sizes: [], colors: [], minPrice: null, maxPrice: null };
      }

      return {
        sizes: Array.isArray(row.sizes) ? (row.sizes as string[]) : [],
        colors: Array.isArray(row.colors) ? (row.colors as string[]) : [],
        minPrice:
          row.min_price != null ? Number(row.min_price) : null,
        maxPrice:
          row.max_price != null ? Number(row.max_price) : null,
      };
    }
  )(categoryIds);
}

function applyStorefrontFilters<
  T extends {
    overlaps: (column: string, value: string[]) => T;
    gte: (column: string, value: number) => T;
    lte: (column: string, value: number) => T;
    eq: (column: string, value: boolean) => T;
  },
>(query: T, filters: StorefrontFilters): T {
  let next = query;

  if (filters.sizes?.length) {
    next = next.overlaps("sizes", filters.sizes);
  }
  if (filters.colors?.length) {
    next = next.overlaps(
      "colors",
      filters.colors.map((color) => color.toLowerCase())
    );
  }
  if (filters.minPrice != null) {
    next = next.gte("effective_price", filters.minPrice);
  }
  if (filters.maxPrice != null) {
    next = next.lte("effective_price", filters.maxPrice);
  }
  if (filters.inStock) {
    next = next.eq("in_stock", true);
  }

  return next;
}

function orderCategoryProducts<T extends { order: (column: string, options: { ascending: boolean }) => T }>(
  query: T,
  sort: CategorySort
): T {
  switch (sort) {
    case "price_asc":
      return query.order("effective_price", { ascending: true });
    case "price_desc":
      return query.order("effective_price", { ascending: false });
    case "name_asc":
      return query.order("name", { ascending: true });
    case "newest":
      return query.order("created_at", { ascending: false });
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}

export async function getProductsByCategory(
  categoryIds: string[],
  storefrontFilters: StorefrontFilters = {},
  options: CategoryProductsOptions = {}
): Promise<CategoryProductsResult> {
  if (!categoryIds.length) {
    return {
      products: [],
      total: 0,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? PRODUCTS_PAGE_SIZE,
    };
  }

  const page = Math.max(1, options.page ?? 1);
  const pageSize = options.pageSize ?? PRODUCTS_PAGE_SIZE;
  const sort = options.sort ?? "newest";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = createPublicClient();

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (storefrontFilters.search) {
    const trimmed = storefrontFilters.search.trim().slice(0, MAX_QUERY_LENGTH);
    const tokens = tokenizeQuery(trimmed);
    if (!tokens.length) {
      return { products: [], total: 0, page, pageSize };
    }

    const rpcData = assertOk(
      "products.categorySearch",
      await supabase.rpc("search_products", { q: trimmed, lim: 500 })
    );

    const productIds = ((rpcData ?? []) as Record<string, unknown>[])
      .map((row) => mapProductRow(row))
      .filter(
        (product) =>
          product.category_id && categoryIds.includes(product.category_id)
      )
      .map((product) => product.id);

    if (!productIds.length) {
      return { products: [], total: 0, page, pageSize };
    }

    query = query.in("id", productIds);
  } else {
    query = query.in("category_id", categoryIds);
  }

  query = applyStorefrontFilters(query, storefrontFilters);
  query = orderCategoryProducts(query, sort);
  query = query.range(from, to);

  const { data, error, count } = await query;
  assertOk("products.byCategory", { data, error });

  return {
    products: ((data ?? []) as Record<string, unknown>[]).map((row) => mapProductRow(row)),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Keyed on the ids it actually depends on rather than the whole product, so
 * the cache key stays small and stable across unrelated field edits.
 * Level-3 ancestor and sibling categories are resolved in memory via
 * `getAllCategories(true)` — one product query only.
 */
function resolveLevel3CategoryId(
  categoryId: string,
  allCategories: Awaited<ReturnType<typeof getAllCategories>>
): string {
  const byId = new Map(allCategories.map((category) => [category.id, category]));
  const category = byId.get(categoryId);
  if (!category) return categoryId;

  let level3Id = categoryId;

  if (category.parent_id) {
    const parent = byId.get(category.parent_id);
    if (parent?.level === 3) {
      level3Id = parent.id;
    } else if (parent?.parent_id) {
      const grandparent = byId.get(parent.parent_id);
      if (grandparent?.level === 3) {
        level3Id = grandparent.id;
      }
    }
  }

  return level3Id;
}

function getRelatedCategoryIds(
  level3Id: string,
  allCategories: Awaited<ReturnType<typeof getAllCategories>>
): string[] {
  return allCategories
    .filter(
      (category) =>
        category.id === level3Id || category.parent_id === level3Id
    )
    .map((category) => category.id);
}

const fetchRelatedProducts = cachedProductQuery(
  "products:related",
  async (
    productId: string,
    categoryIds: string[],
    limit: number
  ): Promise<Product[]> => {
    const supabase = createPublicClient();
    const data = assertOk(
      "products.related",
      await supabase
        .from("products")
        .select("*")
        .in("category_id", categoryIds)
        .eq("is_active", true)
        .neq("id", productId)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit)
    );

    return (data ?? []).map((row) => mapProductRow(row));
  }
);

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  if (!product.category_id) return [];

  const allCategories = await getAllCategories(true);
  const level3Id = resolveLevel3CategoryId(product.category_id, allCategories);
  const categoryIds = getRelatedCategoryIds(level3Id, allCategories).sort();
  if (!categoryIds.length) return [];

  return fetchRelatedProducts(product.id, categoryIds, limit);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const metrics = await getSalesMetrics();
  return metrics.catalog;
}

export async function getSalesMetrics(): Promise<SalesMetrics> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_sales_metrics", {
    p_low_stock_threshold: 5,
  });

  if (error) {
    if (error.code === "PGRST202" || error.message?.includes("get_sales_metrics")) {
      const stats = await getDashboardStatsFallback();
      return {
        revenue: emptyWindow(),
        orders: emptyWindow(),
        aov: emptyWindow(),
        top_by_units: [],
        top_by_revenue: [],
        low_stock_variants: [],
        pending_reviews: 0,
        catalog: stats,
      };
    }

    assertOk("sales.metrics", { data: null, error });
  }

  const payload = (data ?? {}) as Record<string, unknown>;

  return {
    revenue: parseWindow(payload.revenue),
    orders: parseWindow(payload.orders),
    aov: parseWindow(payload.aov),
    top_by_units: parseTopProducts(payload.top_by_units),
    top_by_revenue: parseTopProducts(payload.top_by_revenue),
    low_stock_variants: parseLowStock(payload.low_stock_variants),
    pending_reviews: Number(
      (payload.pending_reviews as number | string | undefined) ?? 0
    ),
    catalog: parseCatalog(payload.catalog),
  };
}

function emptyWindow(): SalesMetricsWindow {
  return { today: 0, last_7d: 0, last_30d: 0 };
}

function parseWindow(value: unknown): SalesMetricsWindow {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    today: Number(row.today ?? 0),
    last_7d: Number(row.last_7d ?? 0),
    last_30d: Number(row.last_30d ?? 0),
  };
}

function parseTopProducts(value: unknown): SalesTopProduct[] {
  if (!Array.isArray(value)) return [];

  return value.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      name: String(item.name ?? "Item"),
      product_id: item.product_id != null ? String(item.product_id) : null,
      units: Number(item.units ?? 0),
      revenue: Number(item.revenue ?? 0),
    };
  });
}

function parseLowStock(value: unknown): LowStockVariant[] {
  if (!Array.isArray(value)) return [];

  return value.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      variant_id: String(item.variant_id),
      product_id: String(item.product_id),
      product_name: String(item.product_name),
      size: item.size != null ? String(item.size) : null,
      color: item.color != null ? String(item.color) : null,
      stock_count: Number(item.stock_count ?? 0),
    };
  });
}

function parseCatalog(value: unknown): DashboardStats {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    totalProducts: Number(row.total_products ?? 0),
    activeProducts: Number(row.active_products ?? 0),
    outOfStock: Number(row.out_of_stock ?? 0),
    totalCategories: Number(row.total_categories ?? 0),
  };
}

async function getDashboardStatsFallback(): Promise<DashboardStats> {
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
      .lte("stock_count", 0),
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

  return mapProductRow(created);
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

  return mapProductRow(updated);
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

export async function getActiveProductsForSitemap(): Promise<
  { slug: string; updated_at: string }[]
> {
  return cachedProductQuery("products:sitemap", async () => {
    const supabase = createPublicClient();
    const data = assertOk(
      "products.sitemap",
      await supabase
        .from("products")
        .select("slug, updated_at")
        .eq("is_active", true)
    );

    return ((data ?? []) as { slug: string; updated_at: string }[]).map(
      (row) => ({
        slug: String(row.slug),
        updated_at: String(row.updated_at),
      })
    );
  })();
}
