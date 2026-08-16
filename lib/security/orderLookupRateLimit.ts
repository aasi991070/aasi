import { consumeRateLimit } from "@/lib/security/rateLimit";

/** Guest order lookups allowed per IP per hour. */
export const ORDER_LOOKUP_RATE_LIMIT = 10;

export async function consumeOrderLookupRateLimit(
  ipHash: string
): Promise<boolean> {
  return consumeRateLimit("order_lookup", ipHash, ORDER_LOOKUP_RATE_LIMIT);
}
