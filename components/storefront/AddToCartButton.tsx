"use client";

import { useTransition } from "react";
import { addToCart } from "@/lib/actions/cart";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/hooks/useCartStore";
import { useLiveRegionStore } from "@/hooks/useLiveRegionStore";
import { useUiStore } from "@/hooks/useUiStore";

type AddToCartButtonProps = {
  productId: string;
  variantId?: string | null;
  qty?: number;
  disabled?: boolean;
  label?: string;
  disabledReason?: string;
  className?: string;
};

export function AddToCartButton({
  productId,
  variantId = null,
  qty = 1,
  disabled = false,
  label = "Add to Cart",
  disabledReason,
  className,
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();
  const applyCartResult = useCartStore((state) => state.applyCartResult);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const { showToast } = useUiStore();
  const announce = useLiveRegionStore((state) => state.announce);

  const handleClick = () => {
    if (disabled || isPending) return;

    startTransition(async () => {
      const result = await addToCart({ productId, variantId, qty });

      if (!result.ok) {
        showToast(result.error.message, "error");
        return;
      }

      applyCartResult(result);
      openDrawer();
      showToast("Added to cart", "success");
      announce(
        `Added. ${result.cart.itemCount} ${result.cart.itemCount === 1 ? "item" : "items"} in cart`
      );

      for (const message of result.cart.messages) {
        showToast(message, "info");
      }
    });
  };

  const showReason = disabled && disabledReason;

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={handleClick}
        aria-disabled={disabled || isPending}
        aria-describedby={showReason ? `${productId}-cart-reason` : undefined}
        className={cn(
          "store-btn w-full py-2.5 font-sans text-xs uppercase tracking-[0.1em]",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {isPending ? "Adding..." : label}
      </button>
      {showReason ? (
        <p
          id={`${productId}-cart-reason`}
          className="mt-2 font-sans text-xs text-store-ink-muted"
        >
          {disabledReason}
        </p>
      ) : null}
    </div>
  );
}
