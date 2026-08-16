import { createHash } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Best-effort client IP. Behind Vercel, `x-forwarded-for` is set by the proxy
 * and its first entry is the client. These headers are spoofable in general,
 * which is why hashing with a server-side salt is one layer of defence only.
 */
export function getClientIpFromHeaders(
  headers: Pick<Headers, "get">
): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function getClientIpFromRequest(request: NextRequest): string {
  return getClientIpFromHeaders(request.headers);
}

/**
 * SHA-256 of the client IP with a server-side salt. The raw IP is never stored.
 *
 * Returns null when REVIEW_IP_SALT is unset so callers can fail closed.
 */
export function hashIpAddress(ip: string): string | null {
  const salt = process.env.REVIEW_IP_SALT;
  if (!salt) return null;

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function hashClientIpFromRequest(request: NextRequest): string | null {
  return hashIpAddress(getClientIpFromRequest(request));
}

export function hashClientIpFromHeaders(
  headers: Pick<Headers, "get">
): string | null {
  return hashIpAddress(getClientIpFromHeaders(headers));
}
