import { describe, expect, it, vi } from "vitest";

vi.mock("react", () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

import { buildTree } from "@/lib/queries/categories";
import type { Category } from "@/types";

function cat(partial: Partial<Category> & Pick<Category, "id" | "slug" | "level">): Category {
  return {
    name: partial.slug,
    sort_order: partial.sort_order ?? 0,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("buildTree", () => {
  it("nests children and sorts by sort_order", () => {
    const tree = buildTree([
      cat({ id: "root-b", slug: "mens", level: 1, sort_order: 2 }),
      cat({ id: "root-a", slug: "womens", level: 1, sort_order: 1 }),
      cat({ id: "child", slug: "shirts", level: 2, parent_id: "root-b", sort_order: 1 }),
    ]);

    expect(tree.map((node) => node.slug)).toEqual(["womens", "mens"]);
    expect(tree[1]?.children?.[0]?.slug).toBe("shirts");
  });

  it("treats orphaned nodes as roots", () => {
    const tree = buildTree([
      cat({ id: "orphan", slug: "orphan", level: 3, parent_id: "missing" }),
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.slug).toBe("orphan");
  });

  it("supports deep nesting", () => {
    const tree = buildTree([
      cat({ id: "l1", slug: "mens", level: 1 }),
      cat({ id: "l2", slug: "clothing", level: 2, parent_id: "l1" }),
      cat({ id: "l3", slug: "shirts", level: 3, parent_id: "l2" }),
    ]);

    expect(tree[0]?.children?.[0]?.children?.[0]?.slug).toBe("shirts");
  });
});
