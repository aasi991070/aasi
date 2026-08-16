import Link from "next/link";
import { ShoppingBag } from "lucide-react";

// TODO(24b): read the real line-item count from the cart. Hardcoded until the
// cart actions and the `/cart` route exist. The badge is suppressed at zero —
// a permanent "0" reads as a notification dot, which the storefront rule bars.
const itemCount: number = 0;

export function CartButton() {
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center text-store-ink transition-opacity duration-200 hover:opacity-60"
    >
      <ShoppingBag className="size-5" strokeWidth={1.25} aria-hidden="true" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 min-w-4 rounded-full bg-store-ink px-1 text-center font-sans text-[0.625rem] leading-4 text-store-white"
        >
          {itemCount}
        </span>
      )}
    </Link>
  );
}
