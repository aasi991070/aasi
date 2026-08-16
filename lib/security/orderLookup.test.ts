import { describe, expect, it } from "vitest";
import { emailsMatchConstantTime } from "@/lib/security/orderLookup";

describe("emailsMatchConstantTime", () => {
  it("matches equivalent emails regardless of case", () => {
    expect(emailsMatchConstantTime("Guest@Example.com", "guest@example.com")).toBe(
      true
    );
  });

  it("rejects different emails", () => {
    expect(emailsMatchConstantTime("a@example.com", "b@example.com")).toBe(false);
  });
});
