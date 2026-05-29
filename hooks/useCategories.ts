"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryFormData } from "@/types";

async function fetchCategoryTree(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  const categories = (data ?? []) as Category[];
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));
  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children!.push(cat);
    } else {
      roots.push(cat);
    }
  });

  return roots;
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: fetchCategoryTree,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const supabase = createClient();
      const { data: created, error } = await supabase
        .from("categories")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return created as Category;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CategoryFormData>;
    }) => {
      const supabase = createClient();
      const { data: updated, error } = await supabase
        .from("categories")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return updated as Category;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const supabase = createClient();
      await Promise.all(
        items.map(({ id, sort_order }) =>
          supabase
            .from("categories")
            .update({ sort_order, updated_at: new Date().toISOString() })
            .eq("id", id)
        )
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
