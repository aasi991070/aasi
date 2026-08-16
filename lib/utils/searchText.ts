import type { Category, Product } from "@/types";
import { findLevel1Category } from "@/lib/utils/getGenderCategory";

/**
 * Search filters are concatenated into PostgREST's `or=` grammar, where `,`
 * `.` and `)` are structural. A token carrying any of them rewrites the filter
 * expression rather than being matched against. Everything below exists to make
 * that impossible; prompt 17 replaces the approach with Postgres FTS.
 */
export const MAX_QUERY_LENGTH = 128;
const MAX_TOKENS = 6;
const MAX_TOKEN_LENGTH = 32;

/**
 * Metacharacters are separators, not noise to be stripped. Stripping collapses
 * `a,is_active.eq.false` into `ais_activeeqfalse`, which matches nothing;
 * splitting yields an ordinary multi-word search.
 */
const SPLIT_ON = /[\s,.:;()[\]{}"'\\/|]+/;

/**
 * `\p{M}` is not optional. Devanagari vowel signs and the virama are marks, not
 * letters, so a class of `\p{L}\p{N}` alone silently rewrites कुर्ता to करत.
 * ZWNJ/ZWJ are allowed by codepoint because Indic and Arabic scripts use them
 * to select half-forms; the rest of `\p{Cf}` (bidi overrides especially) stays
 * out. Nothing permitted here is structural in PostgREST's `or=` grammar.
 */
const UNSAFE = /[^\p{L}\p{N}\p{M}\u200c\u200d\-_]/gu;

export function sanitizeToken(token: string): string {
  return token.replace(UNSAFE, "").trim();
}

export function tokenizeQuery(query: string): string[] {
  const tokens: string[] = [];

  for (const raw of query.slice(0, MAX_QUERY_LENGTH).toLowerCase().split(SPLIT_ON)) {
    const token = sanitizeToken(raw);
    // A single character matches most of the catalogue, so it costs a full
    // ilike scan to narrow nothing.
    if (token.length < 2) continue;

    // Slice by code point: a plain slice can cut a surrogate pair in half and
    // produce a lone half-character that matches nothing.
    tokens.push(Array.from(token).slice(0, MAX_TOKEN_LENGTH).join(""));
    if (tokens.length === MAX_TOKENS) break;
  }

  return tokens;
}

export const PRODUCT_SEARCH_FIELDS = [
  "name",
  "slug",
  "description",
  "gender",
] as const;

export const CATEGORY_SEARCH_FIELDS = ["name", "slug", "description"] as const;

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
