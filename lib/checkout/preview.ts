import {
  computeCheckoutTotals,
  type CheckoutLineInput,
} from "@/lib/checkout/totals";
import type { CartSummary, Coupon, ShippingRate } from "@/types";

export function buildCheckoutLinesFromCart(
  cart: CartSummary,
  productTaxRates: Record<string, number | null | undefined>
): CheckoutLineInput[] {
  return cart.items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    name: item.product?.name ?? "Item",
    qty: item.qty,
    unitPrice: item.unit_price_snapshot,
    productTaxRate: productTaxRates[item.product_id] ?? null,
  }));
}

export function computeCheckoutPreview(
  cart: CartSummary,
  shippingRate: Pick<ShippingRate, "amount" | "free_above">,
  productTaxRates: Record<string, number | null | undefined>,
  coupon?: Pick<Coupon, "type" | "value"> | null
) {
  const lines = buildCheckoutLinesFromCart(cart, productTaxRates);
  return computeCheckoutTotals(lines, shippingRate, coupon);
}
