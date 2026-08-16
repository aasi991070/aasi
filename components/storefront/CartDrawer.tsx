"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartLineItem } from "@/components/storefront/CartLineItem";
import { formatPrice } from "@/lib/utils/formatPrice";
import { useCartStore } from "@/hooks/useCartStore";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const cart = useCartStore((state) => state.cart);
  const drawerOpen = useCartStore((state) => state.drawerOpen);
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const discount = cart?.discount ?? 0;

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side={mobile ? "bottom" : "right"}
        className={cn(
          "border-store-border bg-store-white p-0",
          mobile ? "max-h-[85vh] rounded-t-lg" : "w-full sm:max-w-md"
        )}
      >
        <SheetHeader className="border-b border-store-border px-6 py-4 text-left">
          <SheetTitle className="font-sans text-base uppercase tracking-[0.15em] text-store-ink">
            Your bag
          </SheetTitle>
          <SheetDescription className="font-sans text-sm text-store-ink-muted">
            {cart?.itemCount
              ? `${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`
              : "Your bag is empty"}
          </SheetDescription>
        </SheetHeader>

        {items.length ? (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} />
              ))}
            </div>

            <div className="border-t border-store-border px-6 py-4">
              <div className="flex items-center justify-between font-sans text-sm text-store-ink">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 ? (
                <div className="mt-2 flex items-center justify-between font-sans text-sm text-store-accent-dark">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              ) : null}
              <Link
                href="/checkout"
                onClick={() => setDrawerOpen(false)}
                className="store-btn mt-4 block w-full py-3 text-center font-sans text-xs uppercase tracking-[0.1em]"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={() => setDrawerOpen(false)}
                className="mt-3 block text-center font-sans text-xs uppercase tracking-[0.15em] text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
              >
                View full cart
              </Link>
            </div>
          </>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="font-sans text-sm text-store-ink-muted">
              Your bag is empty.
            </p>
            <Link
              href="/category/mens"
              onClick={() => setDrawerOpen(false)}
              className="store-btn mt-6 inline-block px-8 py-3 font-sans text-xs uppercase tracking-[0.1em]"
            >
              Browse the catalogue
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
