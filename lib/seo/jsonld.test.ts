import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  productJsonLd,
} from "./jsonld";
import type { Product, ProductReview, ReviewSummary } from "@/types";

const baseProduct: Product = {
  id: "prod-1",
  name: "Silk Kurta",
  slug: "silk-kurta",
  description: "A fine silk kurta.",
  price: 1299,
  sale_price: 999,
  sizes: ["M"],
  colors: ["black"],
  images: ["folder/image.jpg"],
  in_stock: true,
  stock_count: 5,
  is_featured: false,
  is_active: true,
  tags: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("productJsonLd", () => {
  it("uses numeric prices, not formatted strings", () => {
    const data = productJsonLd(baseProduct, { average: 0, count: 0 }, [], []);
    const offers = data.offers as Record<string, unknown>;

    expect(offers.price).toBe(999);
    expect(typeof offers.price).toBe("number");
  });

  it("omits aggregateRating when there are no reviews", () => {
    const data = productJsonLd(baseProduct, { average: 0, count: 0 }, [], []);

    expect(data).not.toHaveProperty("aggregateRating");
  });

  it("includes aggregateRating when review count is positive", () => {
    const summary: ReviewSummary = { average: 4.5, count: 2 };
    const data = productJsonLd(baseProduct, summary, [], []);

    expect(data.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.5,
      reviewCount: 2,
      bestRating: 5,
    });
  });

  it("maps up to five reviews", () => {
    const reviews: ProductReview[] = Array.from({ length: 6 }, (_, index) => ({
      id: `review-${index}`,
      product_id: baseProduct.id,
      author_name: `Author ${index}`,
      rating: 5,
      body: `Review ${index}`,
      status: "approved",
      created_at: "2026-01-02T00:00:00.000Z",
    }));

    const data = productJsonLd(
      baseProduct,
      { average: 5, count: 6 },
      reviews,
      []
    );

    expect((data.review as unknown[]).length).toBe(5);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers list items from one", () => {
    const data = breadcrumbJsonLd([
      { name: "Home", url: "https://example.com/" },
      { name: "Women", url: "https://example.com/category/womens" },
    ]);

    expect(data.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://example.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Women",
        item: "https://example.com/category/womens",
      },
    ]);
  });
});
