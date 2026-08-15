"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";
import { CategoryBreadcrumb } from "@/components/storefront/CategoryBreadcrumb";
import { SizeSelector } from "@/components/storefront/SizeSelector";
import { ColorSelector } from "@/components/storefront/ColorSelector";
import Link from "next/link";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { formatPrice } from "@/lib/utils/formatPrice";
import { splitDescriptionParagraphs } from "@/lib/utils/formatDescription";
import { getCategoryHref } from "@/lib/utils/getGenderCategory";
import type { Category, Product, ProductReview, ReviewSummary } from "@/types";

interface ProductDetailClientProps {
  product: Product;
  breadcrumb: Category[];
  related: Product[];
  genderCategory?: Category;
  initialReviews: ProductReview[];
  reviewSummary: ReviewSummary;
}

export function ProductDetailClient({
  product,
  breadcrumb,
  related,
  genderCategory,
  initialReviews,
  reviewSummary,
}: ProductDetailClientProps) {
  const descriptionParagraphs = splitDescriptionParagraphs(product.description);
  const [selectedSize, setSelectedSize] = useState<string>();
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0] ?? undefined
  );

  const hasSale =
    product.sale_price != null && product.sale_price < product.price;

  const unavailableSizes = product.sizes.filter((size) => {
    const variant = product.variants?.find(
      (v) => v.size === size && v.color === selectedColor
    );
    return variant ? variant.stock_count <= 0 : !product.in_stock;
  });

  return (
    <>
      <PageHeader title={product.name} subtitle={product.category?.name} />

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductImageGallery
          images={product.images}
          thumbnailUrl={product.thumbnail_url}
          productName={product.name}
        />

        <div className="v18-card p-6 lg:p-8">
          <CategoryBreadcrumb items={breadcrumb} />

          {genderCategory && (
            <Link
              href={getCategoryHref([genderCategory])}
              className="mt-3 inline-flex rounded-full border border-v18-border px-3 py-1 text-xs font-medium uppercase tracking-wider text-v18-primary hover:bg-slate-50"
            >
              {genderCategory.name}
            </Link>
          )}

          <div className="mt-4 flex items-center gap-3">
            {hasSale ? (
              <>
                <span className="text-xl font-semibold text-v18-primary">
                  {formatPrice(product.sale_price!)}
                </span>
                <span className="text-lg v18-text-muted line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-xl font-semibold v18-text-heading">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {product.colors.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider v18-text-muted">
                Color — {selectedColor}
              </p>
              <ColorSelector
                colors={product.colors}
                value={selectedColor}
                onChange={setSelectedColor}
              />
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider v18-text-muted">
                Size
              </p>
              <SizeSelector
                sizes={product.sizes}
                unavailableSizes={unavailableSizes}
                value={selectedSize}
                onChange={setSelectedSize}
              />
            </div>
          )}

          <button
            type="button"
            className="v18-btn-primary mt-8 w-full py-3 text-xs font-medium uppercase tracking-[0.15em]"
          >
            Add to Cart
          </button>

          {descriptionParagraphs.length > 0 && (
            <div className="mt-8 border-t border-v18-border pt-6">
              {descriptionParagraphs.map((para, i) => (
                <p
                  key={i}
                  className="mt-3 first:mt-0 text-sm leading-relaxed v18-text-muted"
                >
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductReviews
        productId={product.id}
        initialReviews={initialReviews}
        initialSummary={reviewSummary}
      />

      {related.length > 0 && (
        <div className="mt-12">
          <ProductGrid products={related} title="You May Also Like" />
        </div>
      )}
    </>
  );
}
