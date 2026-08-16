"use client";

import { useEffect } from "react";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { useCartStore } from "@/hooks/useCartStore";
import type { CartSummary } from "@/types";

interface CartProviderProps {
  initialCart: CartSummary | null;
  children: React.ReactNode;
}

export function CartProvider({ initialCart, children }: CartProviderProps) {
  const setCart = useCartStore((state) => state.setCart);

  useEffect(() => {
    if (initialCart) {
      setCart(initialCart);
    }
  }, [initialCart, setCart]);

  return (
    <>
      {children}
      <CartDrawer />
    </>
  );
}
