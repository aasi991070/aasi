"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { ColorSelector } from "@/components/storefront/ColorSelector";
import { SizeSelector } from "@/components/storefront/SizeSelector";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { Product } from "@/types";

type ProductPurchasePanelProps = {
  product: Product;
};

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const [selectedSize, setSelectedSize] = useState<string>();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [stickyVisible, setStickyVisible] = useState(false);
  const purchaseAnchorRef = useRef<HTMLDivElement>(null);

  const hasSale =
    product.sale_price != null && product.sale_price < product.price;
  const displayPrice = hasSale ? product.sale_price! : product.price;

  const unavailableSizes = useMemo(
    () =>
      product.sizes.filter((size) => {
        const variant = product.variants?.find(
          (entry) => entry.size === size && entry.color === selectedColor
        );
        return variant ? variant.stock_count <= 0 : !product.in_stock;
      }),
    [product, selectedColor]
  );

  const requiresSize = product.sizes.length > 0;
  const sizeMissing = requiresSize && !selectedSize;
  const sizeUnavailable =
    selectedSize != null && unavailableSizes.includes(selectedSize);
  const cartDisabled = sizeMissing || sizeUnavailable || !product.in_stock;

  const cartLabel = sizeMissing
    ? "Select a size"
    : sizeUnavailable
      ? "Unavailable"
      : !product.in_stock
        ? "Sold out"
        : "Add to Cart";

  const stockMessage = (() => {
    if (!product.in_stock) return "Currently unavailable.";
    if (sizeMissing) return "Choose a size to continue.";
    if (selectedSize && unavailableSizes.includes(selectedSize)) {
      return "Selected size is out of stock.";
    }
    return "In stock — ready to ship.";
  })();

  useEffect(() => {
    const node = purchaseAnchorRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -1px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {product.colors.length > 0 ? (
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
              Colour
            </p>
            <p className="font-sans text-sm text-store-ink-muted">{selectedColor}</p>
          </div>
          <ColorSelector
            colors={product.colors}
            value={selectedColor}
            onChange={setSelectedColor}
          />
        </div>
      ) : null}

      {product.sizes.length > 0 ? (
        <div className="mt-8">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
              Size
            </p>
            <Link
              href="/size-guide"
              className="font-sans text-xs text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
            >
              Size guide
            </Link>
          </div>
          <SizeSelector
            sizes={product.sizes}
            unavailableSizes={unavailableSizes}
            value={selectedSize}
            onChange={setSelectedSize}
          />
        </div>
      ) : null}

      <div className="mt-8">
        <p className="mb-3 font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
          Quantity
        </p>
        <div className="inline-flex items-center border border-store-border">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="inline-flex size-11 items-center justify-center text-store-ink transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:text-store-ink-muted"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="min-w-12 text-center font-sans text-sm text-store-ink">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((current) => current + 1)}
            className="inline-flex size-11 items-center justify-center text-store-ink transition-opacity hover:opacity-60"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={purchaseAnchorRef} className="mt-8 space-y-3">
        <AddToCartButton disabled={cartDisabled} label={cartLabel} />
        <p className="font-sans text-sm text-store-ink-muted">{stockMessage}</p>
        <p className="font-sans text-sm text-store-ink-muted">
          Estimated delivery details appear at checkout.
        </p>
      </div>

      {stickyVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-store-border bg-store-white px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-sm text-store-ink">
                {product.name}
              </p>
              <p className="font-sans text-base font-medium text-store-ink">
                {formatPrice(displayPrice)}
              </p>
            </div>
            <div className="w-40 shrink-0">
              <AddToCartButton disabled={cartDisabled} label={cartLabel} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
