"use client";

import { useMemo, useState, useTransition } from "react";
import { CartLineItem } from "@/components/storefront/CartLineItem";
import { applyCoupon, removeCoupon } from "@/lib/actions/cart";
import { computeCheckoutPreview } from "@/lib/checkout/preview";
import { formatPrice } from "@/lib/utils/formatPrice";
import { useCartStore } from "@/hooks/useCartStore";
import { useUiStore } from "@/hooks/useUiStore";
import type { CartSummary, Coupon, ShippingRate } from "@/types";

interface CheckoutOrderSummaryProps {
  initialCart: CartSummary;
  shippingRates: ShippingRate[];
  shippingRateId: string;
  productTaxRates: Record<string, number | null>;
  coupon: Pick<Coupon, "type" | "value"> | null;
  /** Collapsible summary for small screens (left column). */
  mobileCollapsible?: boolean;
  /**
   * Sticky desktop aside. Only enable in the right column — putting it in the
   * left column covers the address accordion while scrolling.
   */
  showDesktopAside?: boolean;
}

export function CheckoutOrderSummary({
  initialCart,
  shippingRates,
  shippingRateId,
  productTaxRates,
  coupon,
  mobileCollapsible = true,
  showDesktopAside = false,
}: CheckoutOrderSummaryProps) {
  const cart = useCartStore((state) => state.cart) ?? initialCart;
  const applyCartResult = useCartStore((state) => state.applyCartResult);
  const { showToast } = useUiStore();
  const [couponInput, setCouponInput] = useState(cart.couponCode ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedRate =
    shippingRates.find((rate) => rate.id === shippingRateId) ?? shippingRates[0];

  const totals = useMemo(() => {
    if (!selectedRate) {
      return null;
    }

    return computeCheckoutPreview(cart, selectedRate, productTaxRates, coupon);
  }, [cart, coupon, productTaxRates, selectedRate]);

  const handleApplyCoupon = () => {
    startTransition(async () => {
      const result = await applyCoupon(couponInput);
      if (result.ok) {
        applyCartResult(result);
        for (const message of result.cart.messages) {
          showToast(message, "success");
        }
      } else {
        showToast(result.error.message, "error");
      }
    });
  };

  const handleRemoveCoupon = () => {
    setCouponInput("");
    startTransition(async () => {
      const result = await removeCoupon();
      if (result.ok) {
        applyCartResult(result);
        showToast("Coupon removed", "info");
      } else {
        showToast(result.error.message, "error");
      }
    });
  };

  const summaryBody = (
    <>
      <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
        {cart.items.map((item) => (
          <CartLineItem key={item.id} item={item} compact />
        ))}
      </div>

      <div className="mt-6 space-y-3 font-sans text-sm text-store-ink">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(totals?.subtotal ?? cart.subtotal)}</span>
        </div>
        {(totals?.discount ?? cart.discount) > 0 ? (
          <div className="flex justify-between text-store-accent-dark">
            <span>Discount</span>
            <span>-{formatPrice(totals?.discount ?? cart.discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {selectedRate
              ? totals?.shippingFee === 0
                ? "Free"
                : formatPrice(totals?.shippingFee ?? selectedRate.amount)
              : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tax (GST)</span>
          <span>{formatPrice(totals?.tax ?? 0)}</span>
        </div>
        <div className="flex justify-between border-t border-store-border pt-3 text-base font-medium">
          <span>Total</span>
          <span>{formatPrice(totals?.total ?? cart.subtotal - cart.discount)}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <label
          htmlFor="checkout-coupon"
          className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
        >
          Coupon code
        </label>
        <div className="flex gap-2">
          <input
            id="checkout-coupon"
            value={couponInput}
            onChange={(event) => setCouponInput(event.target.value)}
            placeholder="Enter code"
            className="min-h-11 flex-1 border border-store-border bg-store-white px-3 font-sans text-sm text-store-ink outline-none focus:border-store-ink"
          />
          <button
            type="button"
            disabled={isPending || !couponInput.trim()}
            onClick={handleApplyCoupon}
            className="store-btn px-4 py-2 font-sans text-xs uppercase tracking-[0.1em] disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        {cart.couponCode ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleRemoveCoupon}
            className="font-sans text-xs text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
          >
            Remove {cart.couponCode}
          </button>
        ) : null}
      </div>
    </>
  );

  return (
    <>
      {showDesktopAside ? (
        <aside className="hidden h-fit border border-store-border bg-store-white p-6 lg:sticky lg:top-24 lg:block">
          <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
            Order summary
          </h2>
          {summaryBody}
        </aside>
      ) : null}

      {mobileCollapsible ? (
        <div className="border border-store-border bg-store-white lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-4 font-sans text-sm text-store-ink"
            aria-expanded={mobileOpen}
          >
            <span>
              Order summary ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
            </span>
            <span className="font-medium">
              {formatPrice(totals?.total ?? cart.subtotal - cart.discount)}
            </span>
          </button>
          {mobileOpen ? (
            <div className="border-t border-store-border px-4 pb-4 pt-2">
              {summaryBody}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
