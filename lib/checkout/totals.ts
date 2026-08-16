import { computeCouponDiscount } from "@/lib/cart/coupon";
import { lineTaxAmount, resolveLineTaxRate, roundMoney } from "@/lib/checkout/tax";
import type { Coupon, ShippingRate } from "@/types";

export interface CheckoutLineInput {
  id: string;
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  productTaxRate?: number | null;
}

export interface CheckoutTotalsLine extends CheckoutLineInput {
  lineSubtotal: number;
  lineDiscount: number;
  taxableAmount: number;
  taxRate: number;
  lineTax: number;
  lineTotal: number;
}

export interface CheckoutTotals {
  lines: CheckoutTotalsLine[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
}

export function computeShippingFee(
  rate: Pick<ShippingRate, "amount" | "free_above">,
  subtotalAfterDiscount: number
): number {
  if (
    rate.free_above != null &&
    subtotalAfterDiscount >= Number(rate.free_above)
  ) {
    return 0;
  }

  return roundMoney(Number(rate.amount));
}

export function computeCheckoutTotals(
  lines: CheckoutLineInput[],
  shippingRate: Pick<ShippingRate, "amount" | "free_above">,
  coupon?: Pick<Coupon, "type" | "value"> | null
): CheckoutTotals {
  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0)
  );

  const discount = coupon
    ? computeCouponDiscount(coupon, subtotal)
    : 0;

  const enriched: CheckoutTotalsLine[] = lines.map((line) => {
    const lineSubtotal = roundMoney(line.unitPrice * line.qty);
    const lineDiscount =
      subtotal > 0
        ? roundMoney((discount * lineSubtotal) / subtotal)
        : 0;
    const taxableAmount = roundMoney(lineSubtotal - lineDiscount);
    const taxRate = resolveLineTaxRate(line.unitPrice, line.productTaxRate);
    const lineTax = lineTaxAmount(taxableAmount, taxRate);

    return {
      ...line,
      lineSubtotal,
      lineDiscount,
      taxableAmount,
      taxRate,
      lineTax,
      lineTotal: roundMoney(taxableAmount + lineTax),
    };
  });

  const tax = roundMoney(enriched.reduce((sum, line) => sum + line.lineTax, 0));
  const subtotalAfterDiscount = roundMoney(subtotal - discount);
  const shippingFee = computeShippingFee(shippingRate, subtotalAfterDiscount);
  const total = roundMoney(subtotalAfterDiscount + shippingFee + tax);

  return {
    lines: enriched,
    subtotal,
    discount,
    shippingFee,
    tax,
    total,
  };
}
