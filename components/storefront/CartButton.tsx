"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/hooks/useCartStore";

export function CartButton() {
  const itemCount = useCartStore((state) => state.cart?.itemCount ?? 0);

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center text-store-ink transition-opacity duration-200 hover:opacity-60"
    >
      <ShoppingBag className="size-5" strokeWidth={1.25} aria-hidden="true" />
      {itemCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 min-w-4 rounded-full bg-store-ink px-1 text-center font-sans text-[0.625rem] leading-4 text-store-white"
        >
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
