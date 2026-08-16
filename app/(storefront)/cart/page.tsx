import type { Metadata } from "next";
import { CartPageClient } from "@/components/storefront/CartPageClient";
import { getServerCart } from "@/lib/cart/server";
import type { CartSummary } from "@/types";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review items in your Aasi bag before checkout.",
  robots: { index: false, follow: false },
};

function emptyCart(): CartSummary {
  const now = new Date().toISOString();
  return {
    id: "",
    session_id: "",
    user_id: null,
    status: "active",
    currency: "INR",
    created_at: now,
    updated_at: now,
    items: [],
    subtotal: 0,
    discount: 0,
    itemCount: 0,
    couponCode: null,
    messages: [],
  };
}

export default async function CartPage() {
  const cart = (await getServerCart()) ?? emptyCart();

  return <CartPageClient initialCart={cart} />;
}
