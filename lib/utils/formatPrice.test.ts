import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/utils/formatPrice";

describe("formatPrice", () => {
  it("formats INR with grouping", () => {
    expect(formatPrice(1299)).toMatch(/₹\s?1,299\.00/);
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toMatch(/₹\s?0\.00/);
  });

  it("keeps two decimal places", () => {
    expect(formatPrice(99.9)).toMatch(/99\.90/);
  });

  it("formats large values with Indian grouping", () => {
    expect(formatPrice(1_234_567.89)).toMatch(/12,34,567\.89/);
  });
});
