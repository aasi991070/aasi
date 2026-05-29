"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";
import { CategoryBreadcrumb } from "@/components/storefront/CategoryBreadcrumb";
import { SizeSelector } from "@/components/storefront/SizeSelector";
import { ColorSelector } from "@/components/storefront/ColorSelector";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { Category, Product } from "@/types";

interface ProductDetailClientProps {
  product: Product;
  breadcrumb: Category[];
  related: Product[];
}

export function ProductDetailClient({
  product,
  breadcrumb,
  related,
}: ProductDetailClientProps) {
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
        <ProductImageGallery images={product.images} productName={product.name} />

        <div className="v18-card p-6 lg:p-8">
          <CategoryBreadcrumb items={breadcrumb} />

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

          {product.description && (
            <div className="mt-8 border-t border-v18-border pt-6">
              <p className="text-sm leading-relaxed v18-text-muted">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <ProductGrid products={related} title="You May Also Like" />
        </div>
      )}
    </>
  );
}

export function buildProductMetadata(product: Product): Metadata {
  return {
    title: product.name,
    description: product.description ?? `${product.name} — Atelier`,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
    },
  };
}
