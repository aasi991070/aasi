import { createClient } from "@/lib/supabase/server";
import { getAllCategories } from "@/lib/queries/categories";
import { PRODUCTS_PAGE_SIZE } from "@/constants";
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    return data ? mapProduct(data) : null;
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

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  try {
    const supabase = await createClient();
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

export async function getNewArrivals(limit = 12): Promise<Product[]> {
  try {
    const supabase = await createClient();
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

export async function getProductsByCategory(
  categoryIds: string[],
  storefrontFilters: StorefrontFilters = {}
): Promise<Product[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select("*")
      .in("category_id", categoryIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (storefrontFilters.inStock) {
      query = query.eq("in_stock", true);
    }
    if (storefrontFilters.minPrice != null) {
      query = query.gte("price", storefrontFilters.minPrice);
    }
    if (storefrontFilters.maxPrice != null) {
      query = query.lte("price", storefrontFilters.maxPrice);
    }

    const { data, error } = await query;
    if (error) throw error;

    let products = (data ?? []).map(mapProduct);

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

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  if (!product.category_id) return [];

  try {
    const supabase = await createClient();
    const { data: category } = await supabase
      .from("categories")
      .select("parent_id")
      .eq("id", product.category_id)
      .maybeSingle();

    let level3Id = product.category_id;
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
      .neq("id", product.id)
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map(mapProduct);
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
