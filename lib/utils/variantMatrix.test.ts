import { describe, expect, it } from "vitest";
import {
  reconcileVariants,
  suggestVariantSku,
  variantsFromProduct,
  variantsWithStockBeingRemoved,
} from "@/lib/utils/variantMatrix";
import type { ProductVariant } from "@/types";

describe("suggestVariantSku", () => {
  it("normalizes slug, size and color", () => {
    expect(suggestVariantSku("seed-shirt", "M", "Navy Blue")).toBe(
      "SEED-SHIRT-M-NAVY-BLUE"
    );
  });
});

describe("variantsFromProduct", () => {
  it("builds a matrix from sizes and colors", () => {
    const rows = variantsFromProduct(["M"], ["Black"], "seed-shirt");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.sku).toBe("SEED-SHIRT-M-BLACK");
  });

  it("preserves existing variant data", () => {
    const existing: ProductVariant[] = [
      {
        id: "v1",
        product_id: "p1",
        size: "M",
        color: "black",
        stock_count: 4,
        is_enabled: true,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const rows = variantsFromProduct(["M"], ["Black"], "seed-shirt", existing);
    expect(rows[0]?.stock_count).toBe(4);
    expect(rows[0]?.id).toBe("v1");
  });
});

describe("reconcileVariants", () => {
  it("adds new combinations", () => {
    const rows = reconcileVariants(["M", "L"], ["Black"], "seed-shirt", []);
    expect(rows).toHaveLength(2);
  });
});

describe("variantsWithStockBeingRemoved", () => {
  it("flags variants that will lose stock", () => {
    const removed = variantsWithStockBeingRemoved(
      [
        {
          size: "M",
          color: "black",
          stock_count: 3,
          is_enabled: true,
          sku: "SKU",
          price_override: null,
        },
      ],
      [],
      ["Black"]
    );

    expect(removed).toHaveLength(1);
  });
});
