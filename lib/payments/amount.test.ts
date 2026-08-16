import { describe, expect, it } from "vitest";
import { orderTotalToPaise } from "@/lib/payments/amount";

describe("orderTotalToPaise", () => {
  it("rounds float totals to integer paise", () => {
    expect(orderTotalToPaise(1234.35)).toBe(123435);
    expect(orderTotalToPaise(99.99)).toBe(9999);
  });

  it("rejects non-positive amounts", () => {
    expect(() => orderTotalToPaise(0)).toThrow(/Invalid Razorpay amount/);
  });
});
