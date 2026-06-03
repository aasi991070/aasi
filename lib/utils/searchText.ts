import type { Category, Product } from "@/types";
import { findLevel1Category } from "@/lib/utils/getGenderCategory";

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function buildProductSearchText(
  product: Product,
  allCategories: Category[] = []
): string {
  const l1 = findLevel1Category(product.category_id, allCategories);
  const parts = [
    product.name,
    product.slug,
    product.description,
    product.gender,
    product.category?.name,
    l1?.name,
    ...(product.tags ?? []),
    ...(product.sizes ?? []),
    ...(product.colors ?? []),
  ];

  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function matchesAllTokens(haystack: string, tokens: string[]): boolean {
  if (!tokens.length) return false;
  return tokens.every((token) => haystack.includes(token));
}

export type SearchMatchField =
  | "name"
  | "description"
  | "slug"
  | "gender"
  | "tags"
  | "sizes"
  | "colors"
  | "category";

export function getMatchedFields(
  product: Product,
  tokens: string[],
  allCategories: Category[] = []
): SearchMatchField[] {
  if (!tokens.length) return [];

  const matched = new Set<SearchMatchField>();
  const l1 = findLevel1Category(product.category_id, allCategories);

  const check = (field: SearchMatchField, text: string | undefined) => {
    if (!text) return;
    const lower = text.toLowerCase();
    if (tokens.some((t) => lower.includes(t))) matched.add(field);
  };

  check("name", product.name);
  check("description", product.description);
  check("slug", product.slug);
  check("gender", product.gender);
  check("category", [product.category?.name, l1?.name].filter(Boolean).join(" "));

  for (const tag of product.tags ?? []) {
    if (tokens.some((t) => tag.toLowerCase().includes(t))) matched.add("tags");
  }
  for (const size of product.sizes ?? []) {
    if (tokens.some((t) => size.toLowerCase().includes(t))) matched.add("sizes");
  }
  for (const color of product.colors ?? []) {
    if (tokens.some((t) => color.toLowerCase().includes(t))) matched.add("colors");
  }

  return Array.from(matched);
}

export function excerptAroundMatch(
  text: string,
  tokens: string[],
  maxLength = 120
): string {
  const lower = text.toLowerCase();
  let index = -1;
  for (const token of tokens) {
    const i = lower.indexOf(token);
    if (i >= 0) {
      index = i;
      break;
    }
  }
  if (index < 0) return text.slice(0, maxLength);

  const start = Math.max(0, index - 40);
  const excerpt = text.slice(start, start + maxLength);
  return (start > 0 ? "…" : "") + excerpt + (start + maxLength < text.length ? "…" : "");
}
