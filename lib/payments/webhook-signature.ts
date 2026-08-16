import { createHmac, timingSafeEqual } from "crypto";
import { getRazorpayWebhookSecret } from "@/lib/payments/razorpay";

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", getRazorpayWebhookSecret())
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
