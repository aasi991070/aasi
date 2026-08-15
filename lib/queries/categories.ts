import { unstable_cache } from "next/cache";
import { REVALIDATE_SECONDS } from "@/constants";
import { assertOk } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Category,
  CategoryFormData,
} from "@/types";

/**
 * Reads split two ways.
 *
 * `activeOnly` reads are anonymous storefront data: they go through the
 * cookie-free client and are cached under the `categories` tag, which the
 * catalogue server actions invalidate on every write.
 *
 * Everything else needs to see inactive rows, which RLS only exposes to an
 * admin session, so it stays on the cookie-bound client and is not cached.
 */
const CATEGORIES_TAG = "categories";

function cachedCategoryQuery<TArgs extends unknown[], TResult>(
  keyPrefix: string,
  fn: (...args: TArgs) => Promise<TResult>
) {
  return (...args: TArgs) =>
    unstable_cache(() => fn(...args), [keyPrefix, JSON.stringify(args)], {
      tags: [CATEGORIES_TAG],
      revalidate: REVALIDATE_SECONDS,
    })();
}

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

async function fetchCategories(
  activeOnly: boolean,
  usePublicClient: boolean
): Promise<Category[]> {
  const supabase = usePublicClient ? createPublicClient() : await createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const data = assertOk("categories.list", await query);
  return (data ?? []) as Category[];
}

const getCachedActiveCategories = cachedCategoryQuery(
  "categories:all-active",
  () => fetchCategories(true, true)
);

export async function getCategoryTree(activeOnly = false): Promise<Category[]> {
  const categories = activeOnly
    ? await getCachedActiveCategories()
    : await fetchCategories(false, false);
  return buildTree(categories);
}

export async function getAllCategories(activeOnly = false): Promise<Category[]> {
  return activeOnly
    ? getCachedActiveCategories()
    : fetchCategories(false, false);
}

export async function getCategoriesByLevel(
  level: 1 | 2 | 3 | 4,
  activeOnly = false
): Promise<Category[]> {
  if (activeOnly) {
    const all = await getCachedActiveCategories();
    return all.filter((c) => c.level === level);
  }

  const supabase = await createClient();
  const data = assertOk(
    "categories.byLevel",
    await supabase
      .from("categories")
      .select("*")
      .eq("level", level)
      .order("sort_order", { ascending: true })
  );

  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  return cachedCategoryQuery("categories:by-slug", async (s: string) => {
    const supabase = createPublicClient();
    const data = assertOk(
      "categories.bySlug",
      await supabase.from("categories").select("*").eq("slug", s).maybeSingle()
    );

    // Genuinely absent, not a failure.
    return data as Category | null;
  })(slug);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const data = assertOk(
    "categories.byId",
    await supabase.from("categories").select("*").eq("id", id).maybeSingle()
  );

  return data as Category | null;
}

export async function getChildCategories(
  parentId: string,
  activeOnly = false
): Promise<Category[]> {
  if (activeOnly) {
    // Filtered from the one cached read rather than a query per parent —
    // the home page calls this once per level-1 category.
    const all = await getCachedActiveCategories();
    return all.filter((c) => c.parent_id === parentId);
  }

  const supabase = await createClient();
  const data = assertOk(
    "categories.children",
    await supabase
      .from("categories")
      .select("*")
      .eq("parent_id", parentId)
      .order("sort_order", { ascending: true })
  );

  return (data ?? []) as Category[];
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
): Promise<Category> {
  const supabase = await createClient();
  const created = assertOk(
    "categories.create",
    await supabase.from("categories").insert(data).select().single()
  );

  return created as Category;
}

export async function updateCategory(
  id: string,
  data: Partial<CategoryFormData>
): Promise<Category> {
  const supabase = await createClient();
  const updated = assertOk(
    "categories.update",
    await supabase
      .from("categories")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
  );

  return updated as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  assertOk(
    "categories.delete",
    await supabase.from("categories").delete().eq("id", id)
  );
}

export async function updateCategorySortOrder(
  items: { id: string; sort_order: number }[]
): Promise<void> {
  const supabase = await createClient();
  const results = await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase
        .from("categories")
        .update({ sort_order, updated_at: new Date().toISOString() })
        .eq("id", id)
    )
  );

  results.forEach((result) => assertOk("categories.reorder", result));
}

export async function getCategoryCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });

  assertOk("categories.count", { data: count, error });
  return count ?? 0;
}
