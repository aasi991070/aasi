import { describe, expect, it } from "vitest";
import { computeCouponDiscount } from "@/lib/cart/coupon";
import {
  computeCheckoutTotals,
  computeShippingFee,
} from "@/lib/checkout/totals";
import { orderTotalToPaise } from "@/lib/payments/amount";

describe("computeCouponDiscount", () => {
  it("applies percent coupons", () => {
    expect(
      computeCouponDiscount({ type: "percent", value: 10 }, 1000)
    ).toBe(100);
  });

  it("caps fixed coupons at subtotal", () => {
    expect(computeCouponDiscount({ type: "fixed", value: 1500 }, 1000)).toBe(
      1000
    );
  });
});

describe("computeShippingFee", () => {
  it("waives shipping above free_above threshold", () => {
    expect(
      computeShippingFee({ amount: 99, free_above: 999 }, 1000)
    ).toBe(0);
  });

  it("charges shipping below threshold", () => {
    expect(
      computeShippingFee({ amount: 99, free_above: 999 }, 998.99)
    ).toBe(99);
  });
});

describe("computeCheckoutTotals", () => {
  it("rounds tax and totals consistently", () => {
    const totals = computeCheckoutTotals(
      [
        {
          id: "1",
          productId: "p1",
          name: "Shirt",
          qty: 2,
          unitPrice: 499.99,
          productTaxRate: 5,
        },
      ],
      { amount: 99, free_above: null },
      { type: "percent", value: 10 }
    );

    expect(totals.discount).toBe(100);
    expect(totals.total).toBeGreaterThan(0);
    expect(Number.isFinite(totals.tax)).toBe(true);
  });
});

describe("orderTotalToPaise", () => {
  it("rounds to integer paise", () => {
    expect(orderTotalToPaise(1234.35)).toBe(123435);
  });
});
