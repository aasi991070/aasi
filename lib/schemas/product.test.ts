import { describe, expect, it } from "vitest";
import { parseProductRow, productRowSchema } from "@/lib/schemas/product";

const validRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Seed Shirt",
  slug: "seed-shirt",
  description: "A test product",
  price: 1299,
  sale_price: null,
  category_id: "22222222-2222-4222-8222-222222222222",
  gender: "men",
  sizes: ["M", "L"],
  colors: ["black"],
  images: ["products/seed-shirt.jpg"],
  thumbnail_url: "products/seed-shirt.jpg",
  in_stock: true,
  stock_count: 12,
  is_featured: false,
  is_active: true,
  tags: ["seed"],
  meta_title: null,
  meta_description: null,
  image_alts: [],
  tax_rate: 5,
  hsn_code: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("productRowSchema", () => {
  it("parses a valid product row", () => {
    expect(parseProductRow(validRow).slug).toBe("seed-shirt");
  });

  it("fails loudly when a required column is missing", () => {
    const { slug: _slug, ...withoutSlug } = validRow;
    void _slug;
    expect(() => productRowSchema.parse(withoutSlug)).toThrow(/slug/);
  });

  it("fails when id is not a uuid", () => {
    expect(() =>
      parseProductRow({ ...validRow, id: "not-a-uuid" })
    ).toThrow();
  });
});
