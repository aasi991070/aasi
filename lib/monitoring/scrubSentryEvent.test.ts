import { describe, expect, it } from "vitest";
import { scrubSentryEvent } from "@/lib/monitoring/scrubSentryEvent";

describe("scrubSentryEvent", () => {
  it("drops user and request fields from the event root", () => {
    const scrubbed = scrubSentryEvent({
      message: "cart.bySession failed",
      user: { email: "guest@example.com", id: "123" },
      request: { headers: { cookie: "session=abc" } },
      tags: { "data.op": "cart.bySession" },
    });

    expect(scrubbed?.message).toBe("cart.bySession failed");
    expect(scrubbed?.tags).toEqual({ "data.op": "cart.bySession" });
    expect(scrubbed).not.toHaveProperty("user");
    expect(scrubbed).not.toHaveProperty("request");
  });

  it("redacts emails, phone numbers, and Razorpay identifiers in messages", () => {
    const scrubbed = scrubSentryEvent({
      message: "Payment failed for guest@example.com pay_ABC123 order_XYZ",
    });

    expect(scrubbed?.message).toContain("[redacted-email]");
    expect(scrubbed?.message).toContain("[redacted-payment-id]");
    expect(scrubbed?.message).not.toContain("guest@example.com");
  });

  it("removes address and raw_payload keys from contexts", () => {
    const scrubbed = scrubSentryEvent({
      contexts: {
        order: {
          shipping_address: "221B Baker Street",
          raw_payload: { secret: "value" },
          status: "paid",
        },
      },
    });

    expect(scrubbed?.contexts?.order).toEqual({ status: "paid" });
  });
});
