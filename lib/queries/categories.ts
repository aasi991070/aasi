import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  CategoryFormData,
} from "@/types";

function buildTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children!.push(cat);
    } else if (!cat.parent_id || cat.level === 1) {
      roots.push(cat);
    }
  });

  const sortChildren = (nodes: Category[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((node) => {
      if (node.children?.length) sortChildren(node.children);
    });
  };

  sortChildren(roots);
  return roots;
}

export async function getCategoryTree(activeOnly = false): Promise<Category[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return buildTree((data ?? []) as Category[]);
  } catch {
    return [];
  }
}

export async function getAllCategories(activeOnly = false): Promise<Category[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
}

export async function getCategoriesByLevel(
  level: 1 | 2 | 3 | 4,
  activeOnly = false
): Promise<Category[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("categories")
      .select("*")
      .eq("level", level)
      .order("sort_order", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data as Category | null;
  } catch {
    return null;
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data as Category | null;
  } catch {
    return null;
  }
}

export async function getChildCategories(
  parentId: string,
  activeOnly = false
): Promise<Category[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("categories")
      .select("*")
      .eq("parent_id", parentId)
      .order("sort_order", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
}

export async function getCategoryBreadcrumb(
  categoryId: string
): Promise<Category[]> {
  const all = await getAllCategories(true);
  const map = new Map(all.map((c) => [c.id, c]));
  const breadcrumb: Category[] = [];
  let current = map.get(categoryId);

  while (current) {
    breadcrumb.unshift(current);
    current = current.parent_id ? map.get(current.parent_id) : undefined;
  }

  return breadcrumb;
}

export async function getDescendantCategoryIds(
  categoryId: string
): Promise<string[]> {
  const all = await getAllCategories();
  const ids = new Set<string>([categoryId]);

  const collect = (parentId: string) => {
    all
      .filter((c) => c.parent_id === parentId)
      .forEach((child) => {
        ids.add(child.id);
        collect(child.id);
      });
  };

  collect(categoryId);
  return Array.from(ids);
}

export async function createCategory(
  data: CategoryFormData
): Promise<Category | null> {
  try {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from("categories")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created as Category;
  } catch {
    return null;
  }
}

export async function updateCategory(
  id: string,
  data: Partial<CategoryFormData>
): Promise<Category | null> {
  try {
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("categories")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated as Category;
  } catch {
    return null;
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

export async function updateCategorySortOrder(
  items: { id: string; sort_order: number }[]
): Promise<boolean> {
  try {
    const supabase = await createClient();
    await Promise.all(
      items.map(({ id, sort_order }) =>
        supabase
          .from("categories")
          .update({ sort_order, updated_at: new Date().toISOString() })
          .eq("id", id)
      )
    );
    return true;
  } catch {
    return false;
  }
}

export async function getCategoryCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}
