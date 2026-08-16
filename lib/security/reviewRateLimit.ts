import {
  hashClientIpFromHeaders,
  hashClientIpFromRequest,
} from "@/lib/security/clientIp";
import { consumeRateLimit } from "@/lib/security/rateLimit";

/** Review submissions allowed per IP per hour. */
export const REVIEW_RATE_LIMIT = 3;

export { hashClientIpFromRequest as hashClientIp };

/** Server actions and route handlers that already have a Headers object. */
export { hashClientIpFromHeaders };

export async function consumeReviewRateLimit(ipHash: string): Promise<boolean> {
  return consumeRateLimit("review", ipHash, REVIEW_RATE_LIMIT);
}
