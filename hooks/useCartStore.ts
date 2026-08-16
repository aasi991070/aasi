import { create } from "zustand";
import type { CartActionResult, CartItemView, CartSummary } from "@/types";

interface CartStore {
  cart: CartSummary | null;
  drawerOpen: boolean;
  setCart: (cart: CartSummary) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  applyCartResult: (result: CartActionResult) => boolean;
  optimisticSetQty: (itemId: string, qty: number) => void;
  optimisticRemoveItem: (itemId: string) => void;
}

function recalcSummary(cart: CartSummary, items: CartItemView[]): CartSummary {
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
  );
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  return {
    ...cart,
    items,
    subtotal,
    itemCount,
  };
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  drawerOpen: false,
  setCart: (cart) => set({ cart }),
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  applyCartResult: (result) => {
    if (!result.ok) return false;
    set({ cart: result.cart });
    return true;
  },
  optimisticSetQty: (itemId, qty) => {
    const cart = get().cart;
    if (!cart) return;

    const items = cart.items.map((item) => {
      if (item.id !== itemId) return item;
      const lineTotal = Number((item.unit_price_snapshot * qty).toFixed(2));
      return {
        ...item,
        qty,
        lineTotal,
        flags: {
          ...item.flags,
          qtyClamped: false,
        },
      };
    });

    set({ cart: recalcSummary(cart, items) });
  },
  optimisticRemoveItem: (itemId) => {
    const cart = get().cart;
    if (!cart) return;

    const items = cart.items.filter((item) => item.id !== itemId);
    set({ cart: recalcSummary(cart, items) });
  },
}));
