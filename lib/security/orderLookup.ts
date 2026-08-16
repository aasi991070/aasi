import { timingSafeEqual } from "crypto";

const EMAIL_PAD_LENGTH = 320;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Constant-time email comparison after normalization. */
export function emailsMatchConstantTime(a: string, b: string): boolean {
  const left = normalizeEmail(a).padEnd(EMAIL_PAD_LENGTH, "\0");
  const right = normalizeEmail(b).padEnd(EMAIL_PAD_LENGTH, "\0");

  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export const ORDER_LOOKUP_FAIL_MESSAGE =
  "We couldn't find an order with those details. Check the order number and email, then try again.";
