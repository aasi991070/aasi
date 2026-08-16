import { describe, expect, it } from "vitest";
import {
  findLevel1Category,
  genderFromCategorySlug,
  getCategoryBreadcrumbPath,
  getCategoryHref,
} from "@/lib/utils/getGenderCategory";
import type { Category } from "@/types";

function cat(partial: Partial<Category> & Pick<Category, "id" | "slug" | "level">): Category {
  return {
    name: partial.slug,
    sort_order: 0,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("genderFromCategorySlug", () => {
  it("maps known slugs", () => {
    expect(genderFromCategorySlug("mens")).toBe("men");
    expect(genderFromCategorySlug("Womens")).toBe("women");
  });
});

describe("findLevel1Category", () => {
  const categories = [
    cat({ id: "l1", slug: "mens", level: 1 }),
    cat({ id: "l2", slug: "shirts", level: 2, parent_id: "l1" }),
    cat({ id: "l3", slug: "casual", level: 3, parent_id: "l2" }),
  ];

  it("walks ancestry to level 1", () => {
    expect(findLevel1Category("l3", categories)?.slug).toBe("mens");
  });

  it("returns undefined for orphaned category", () => {
    expect(
      findLevel1Category("missing", categories)
    ).toBeUndefined();
  });

  it("returns undefined on parent cycle", () => {
    const cyclic = [
      cat({ id: "a", slug: "a", level: 2, parent_id: "b" }),
      cat({ id: "b", slug: "b", level: 2, parent_id: "a" }),
    ];
    expect(findLevel1Category("a", cyclic)).toBeUndefined();
  });
});

describe("getCategoryBreadcrumbPath", () => {
  const categories = [
    cat({ id: "l1", slug: "mens", level: 1 }),
    cat({ id: "l2", slug: "shirts", level: 2, parent_id: "l1" }),
  ];

  it("builds breadcrumb from leaf to root", () => {
    expect(getCategoryBreadcrumbPath("l2", categories).map((c) => c.slug)).toEqual([
      "mens",
      "shirts",
    ]);
  });

  it("stops on cycle instead of looping forever", () => {
    const cyclic = [
      cat({ id: "a", slug: "a", level: 2, parent_id: "b" }),
      cat({ id: "b", slug: "b", level: 2, parent_id: "a" }),
    ];
    expect(getCategoryBreadcrumbPath("a", cyclic).length).toBeLessThanOrEqual(2);
  });
});

describe("getCategoryHref", () => {
  it("joins slugs into a category path", () => {
    expect(
      getCategoryHref([
        cat({ id: "1", slug: "mens", level: 1 }),
        cat({ id: "2", slug: "shirts", level: 2, parent_id: "1" }),
      ])
    ).toBe("/category/mens/shirts");
  });
});
