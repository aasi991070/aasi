"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Product, ProductFilters, ProductFormData } from "@/types";

async function fetchProducts(filters: ProductFilters) {
  const supabase = createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select("*, category:categories(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.search) {
    const tokens = filters.search
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length) {
      query = query.or(
        tokens
          .flatMap((t) => [
            `name.ilike.%${t}%`,
            `slug.ilike.%${t}%`,
            `description.ilike.%${t}%`,
            `gender.ilike.%${t}%`,
          ])
          .join(",")
      );
    }
  }
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.gender) query = query.eq("gender", filters.gender);
  if (filters.inStock !== undefined)
    query = query.eq("in_stock", filters.inStock);

  const { data, error, count } = await query;
  if (error) throw error;
  return { products: (data ?? []) as Product[], total: count ?? 0 };
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProductFormData) => {
      const supabase = createClient();
      const { data: created, error } = await supabase
        .from("products")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return created as Product;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ProductFormData>;
    }) => {
      const supabase = createClient();
      const { data: updated, error } = await supabase
        .from("products")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return updated as Product;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}
