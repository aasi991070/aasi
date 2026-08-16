"use client";

import Link from "next/link";
import { useTransition } from "react";
import { X } from "lucide-react";
import { QuantityStepper } from "@/components/storefront/QuantityStepper";
import { RemoteImageWithFallback } from "@/components/shared/RemoteImageWithFallback";
import { removeCartItem, updateCartItemQty } from "@/lib/actions/cart";
import { getProductImagePaths, resolveImageUrl } from "@/lib/storage/images";
import { formatPrice } from "@/lib/utils/formatPrice";
import { useCartStore } from "@/hooks/useCartStore";
import { useUiStore } from "@/hooks/useUiStore";
import type { CartItemView } from "@/types";

interface CartLineItemProps {
  item: CartItemView;
  compact?: boolean;
}

export function CartLineItem({ item, compact = false }: CartLineItemProps) {
  const [isPending, startTransition] = useTransition();
  const applyCartResult = useCartStore((state) => state.applyCartResult);
  const optimisticSetQty = useCartStore((state) => state.optimisticSetQty);
  const optimisticRemoveItem = useCartStore((state) => state.optimisticRemoveItem);
  const { showToast } = useUiStore();

  const product = item.product;
  const imagePath = product ? getProductImagePaths(product)[0] : undefined;
  const imageUrl = imagePath ? resolveImageUrl(imagePath) : undefined;
  const productName = product?.name ?? "Product";
  const productSlug = product?.slug;

  const variantLabel = [item.variant?.size, item.variant?.color]
    .filter(Boolean)
    .join(" · ");

  const commitQty = (qty: number) => {
    const previous = item.qty;
    optimisticSetQty(item.id, qty);

    startTransition(async () => {
      const result = await updateCartItemQty(item.id, qty);
      if (!applyCartResult(result)) {
        optimisticSetQty(item.id, previous);
        if (!result.ok) {
          showToast(result.error.message, "error");
        }
      }
    });
  };

  const removeLine = () => {
    optimisticRemoveItem(item.id);

    startTransition(async () => {
      const result = await removeCartItem(item.id);
      if (!applyCartResult(result) && !result.ok) {
        showToast(result.error.message, "error");
      }
    });
  };

  return (
    <article
      className={`border-b border-store-border py-4 ${isPending ? "opacity-70" : ""}`}
    >
      <div className="flex gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden bg-store-surface">
          {imageUrl ? (
            productSlug ? (
              <Link href={`/product/${productSlug}`} className="block size-full">
                <RemoteImageWithFallback
                  src={imageUrl}
                  alt={productName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </Link>
            ) : (
              <RemoteImageWithFallback
                src={imageUrl}
                alt={productName}
                fill
                className="object-cover"
                sizes="80px"
              />
            )
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {productSlug ? (
                <Link
                  href={`/product/${productSlug}`}
                  className="font-sans text-sm text-store-ink hover:underline"
                >
                  {productName}
                </Link>
              ) : (
                <p className="font-sans text-sm text-store-ink">{productName}</p>
              )}
              {variantLabel ? (
                <p className="mt-1 font-sans text-xs capitalize text-store-ink-muted">
                  {variantLabel}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={removeLine}
              aria-label={`Remove ${productName} from cart`}
              className="inline-flex size-8 shrink-0 items-center justify-center text-store-ink-muted transition-colors hover:text-store-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {!compact ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <QuantityStepper
                value={item.qty}
                max={Math.max(1, item.availableStock)}
                label={productName}
                onCommit={commitQty}
                onRemove={removeLine}
                disabled={isPending}
              />
              <p className="font-sans text-sm font-medium text-store-ink">
                {formatPrice(item.lineTotal)}
              </p>
            </div>
          ) : (
            <p className="mt-2 font-sans text-sm text-store-ink-muted">
              Qty {item.qty} · {formatPrice(item.lineTotal)}
            </p>
          )}

          {item.flags.priceChanged ? (
            <p className="mt-2 font-sans text-xs text-store-accent-dark">
              Price updated to {formatPrice(item.currentUnitPrice)}
            </p>
          ) : null}
          {item.flags.stockReduced ? (
            <p className="mt-1 font-sans text-xs text-store-accent-dark">
              Only {item.availableStock} left
              {item.qty > item.availableStock ? "; qty reduced" : ""}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
