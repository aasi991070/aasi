"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CartLineItem } from "@/components/storefront/CartLineItem";
import { applyCoupon, removeCoupon } from "@/lib/actions/cart";
import { formatPrice } from "@/lib/utils/formatPrice";
import { useCartStore } from "@/hooks/useCartStore";
import { useUiStore } from "@/hooks/useUiStore";
import type { CartSummary } from "@/types";

interface CartPageClientProps {
  initialCart: CartSummary;
}

export function CartPageClient({ initialCart }: CartPageClientProps) {
  const cart = useCartStore((state) => state.cart) ?? initialCart;
  const applyCartResult = useCartStore((state) => state.applyCartResult);
  const { showToast } = useUiStore();
  const [couponInput, setCouponInput] = useState(cart.couponCode ?? "");
  const [isPending, startTransition] = useTransition();

  const subtotal = cart.subtotal;
  const discount = cart.discount;
  const total = Number(Math.max(0, subtotal - discount).toFixed(2));

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

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
        <h1 className="font-display text-3xl text-store-ink">Your cart</h1>
        <p className="mt-4 font-sans text-sm text-store-ink-muted">
          Your bag is empty.
        </p>
        <Link
          href="/category/mens"
          className="store-btn mt-8 inline-block px-8 py-3 font-sans text-xs uppercase tracking-[0.1em]"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <h1 className="font-display text-3xl text-store-ink">Your cart</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Cart items">
          {cart.items.map((item) => (
            <CartLineItem key={item.id} item={item} />
          ))}

          <Link
            href="/category/mens"
            className="mt-6 inline-block font-sans text-xs uppercase tracking-[0.15em] text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
          >
            Continue shopping
          </Link>
        </section>

        <aside className="h-fit border border-store-border bg-store-white p-6">
          <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
            Order summary
          </h2>

          <div className="mt-6 space-y-3 font-sans text-sm text-store-ink">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-store-accent-dark">
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-store-ink-muted">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between border-t border-store-border pt-3 text-base font-medium">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <label
              htmlFor="cart-coupon"
              className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
            >
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                id="cart-coupon"
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

          <Link
            href="/checkout"
            className="store-btn mt-6 block w-full py-3 text-center font-sans text-xs uppercase tracking-[0.1em]"
          >
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
