import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/** Review submissions allowed per IP per hour. */
export const REVIEW_RATE_LIMIT = 3;

/**
 * Best-effort client IP. Behind Vercel, `x-forwarded-for` is set by the proxy
 * and its first entry is the client. These headers are spoofable in general,
 * which is why this is one layer of defence and not the only one.
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * SHA-256 of the client IP with a server-side salt. The raw IP is never
 * returned and never stored — without the salt the hash cannot be reversed by
 * brute-forcing the (small) IPv4 space.
 *
 * Returns null when REVIEW_IP_SALT is unset, so callers can fail closed rather
 * than fall back to storing something weakly hashed.
 */
export function hashClientIp(request: NextRequest): string | null {
  const salt = process.env.REVIEW_IP_SALT;
  if (!salt) return null;

  return createHash("sha256").update(`${salt}:${getClientIp(request)}`).digest("hex");
}

/**
 * Records one submission against the IP and reports whether it is within the
 * hourly limit. The check and the increment happen in a single Postgres
 * statement so concurrent submissions cannot both pass on a stale count.
 */
export async function consumeReviewRateLimit(ipHash: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("check_review_rate_limit", {
    p_ip_hash: ipHash,
    p_limit: REVIEW_RATE_LIMIT,
  });

  if (error) throw error;
  return data === true;
}
