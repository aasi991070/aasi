import type { ErrorEvent, Event } from "@sentry/types";

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  "message",
  "exception",
  "level",
  "tags",
  "fingerprint",
  "event_id",
  "platform",
  "timestamp",
  "environment",
  "release",
  "contexts",
  "transaction",
  "type",
]);

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const RAZORPAY_ID_PATTERN = /\b(rzp_[a-z0-9_]+|pay_[a-z0-9_]+|order_[a-z0-9_]+)\b/gi;

function scrubString(value: string): string {
  return value
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(PHONE_PATTERN, "[redacted-phone]")
    .replace(RAZORPAY_ID_PATTERN, "[redacted-payment-id]");
}

function scrubUnknown(value: unknown): unknown {
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map(scrubUnknown);
  if (value && typeof value === "object") {
    return scrubObject(value as Record<string, unknown>);
  }
  return value;
}

function scrubObject(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(input)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("email") ||
      lower.includes("phone") ||
      lower.includes("address") ||
      lower.includes("raw_payload") ||
      lower.includes("razorpay")
    ) {
      continue;
    }

    output[key] = scrubUnknown(raw);
  }

  return output;
}

function scrubException(event: ErrorEvent): ErrorEvent["exception"] {
  if (!event.exception?.values) return event.exception;

  return {
    ...event.exception,
    values: event.exception.values.map((value) => ({
      ...value,
      value: value.value ? scrubString(value.value) : value.value,
    })),
  };
}

/**
 * Keep only attributable, non-PII fields before Sentry upload.
 * Uses an allowlist at the event root and strips known sensitive subtrees.
 */
export function scrubSentryEvent<T extends Event>(event: T): T | null {
  const scrubbed = {} as T;

  for (const key of Object.keys(event)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) continue;
    (scrubbed as Record<string, unknown>)[key] = (event as Record<string, unknown>)[
      key
    ];
  }

  if ("message" in scrubbed && typeof scrubbed.message === "string") {
    scrubbed.message = scrubString(scrubbed.message);
  }

  if ("exception" in scrubbed) {
    scrubbed.exception = scrubException(scrubbed as ErrorEvent);
  }

  if ("contexts" in scrubbed && scrubbed.contexts) {
    scrubbed.contexts = scrubObject(
      scrubbed.contexts as Record<string, unknown>
    ) as T["contexts"];
  }

  return scrubbed;
}
