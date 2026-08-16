import type { Category, Gender } from "@/types";

const SLUG_TO_GENDER: Record<string, Gender> = {
  mens: "men",
  men: "men",
  womens: "women",
  women: "women",
  unisex: "unisex",
};

export function genderFromCategorySlug(slug: string): Gender | undefined {
  return SLUG_TO_GENDER[slug.toLowerCase()];
}

export function findLevel1Category(
  categoryId: string | undefined,
  allCategories: Category[]
): Category | undefined {
  if (!categoryId) return undefined;

  const byId = new Map(allCategories.map((c) => [c.id, c]));
  const visited = new Set<string>();
  let current = byId.get(categoryId);

  while (current) {
    if (visited.has(current.id)) {
      return undefined;
    }
    visited.add(current.id);

    if (current.level === 1) return current;
    if (!current.parent_id) return current;
    current = byId.get(current.parent_id);
  }

  return undefined;
}

export function getCategoryBreadcrumbPath(
  categoryId: string | undefined,
  allCategories: Category[]
): Category[] {
  if (!categoryId) return [];

  const byId = new Map(allCategories.map((c) => [c.id, c]));
  const path: Category[] = [];
  const visited = new Set<string>();
  let current = byId.get(categoryId);

  while (current) {
    if (visited.has(current.id)) {
      break;
    }
    visited.add(current.id);

    path.unshift(current);
    if (!current.parent_id) break;
    current = byId.get(current.parent_id);
  }

  return path;
}

export function getCategoryHref(categories: Category[]): string {
  if (!categories.length) return "/";
  return `/category/${categories.map((c) => c.slug).join("/")}`;
}
