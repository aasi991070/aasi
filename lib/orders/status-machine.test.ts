import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  assertOrderTransition,
  canTransitionOrderStatus,
} from "@/lib/orders/status-machine";

describe("order status machine", () => {
  it("allows valid transitions", () => {
    expect(canTransitionOrderStatus("pending", "confirmed")).toBe(true);
    expect(canTransitionOrderStatus("packed", "shipped")).toBe(true);
    expect(canTransitionOrderStatus("delivered", "returned")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransitionOrderStatus("delivered", "packed")).toBe(false);
    expect(canTransitionOrderStatus("cancelled", "confirmed")).toBe(false);
    expect(canTransitionOrderStatus("pending", "pending")).toBe(false);
  });

  it("returns typed errors for invalid moves", () => {
    expect(assertOrderTransition("delivered", "packed")).toEqual({
      code: "INVALID_TRANSITION",
      message: 'Cannot move an order from "delivered" to "packed".',
    });
    expect(assertOrderTransition("cancelled", "confirmed")).toEqual({
      code: "TERMINAL_STATUS",
      message: 'Orders in "cancelled" status cannot be changed.',
    });
  });

  it("lists allowed next statuses", () => {
    expect(allowedNextStatuses("confirmed")).toEqual(["packed", "cancelled"]);
    expect(allowedNextStatuses("returned")).toEqual([]);
  });
});
