"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { hashClientIpFromHeaders } from "@/lib/security/clientIp";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import {
  SUBSCRIBE_INITIAL_STATE,
  subscribeSchema,
  type SubscribeFormState,
} from "@/lib/validation/newsletter";

/** Newsletter sign-ups allowed per IP per hour. */
const NEWSLETTER_RATE_LIMIT = 5;

export async function subscribeAction(
  _prevState: SubscribeFormState,
  formData: FormData
): Promise<SubscribeFormState> {
  const parsed = subscribeSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      ok: false,
      message: first?.message ?? "Enter a valid email address",
    };
  }

  const ipHash = hashClientIpFromHeaders(await headers());
  if (!ipHash) {
    console.error("REVIEW_IP_SALT is not set; refusing newsletter sign-ups.");
    return {
      ok: false,
      message: "Newsletter sign-up is temporarily unavailable.",
    };
  }

  const withinLimit = await consumeRateLimit(
    "newsletter",
    ipHash,
    NEWSLETTER_RATE_LIMIT
  );
  if (!withinLimit) {
    return {
      ok: false,
      message: "Too many attempts. Please try again in an hour.",
    };
  }

  const supabase = createServiceClient();
  const email = parsed.data.email.toLowerCase();

  const { data: existing, error: lookupError } = await supabase
    .from("newsletter_subscribers")
    .select("status")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("[newsletter] lookup failed", lookupError.message);
    return {
      ok: false,
      message: "Something went wrong. Please try again.",
    };
  }

  if (existing?.status === "subscribed") {
    return {
      ok: true,
      message: "You're already on the list.",
    };
  }

  if (existing?.status === "unsubscribed") {
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "subscribed" })
      .eq("email", email);

    if (updateError) {
      console.error("[newsletter] resubscribe failed", updateError.message);
      return {
        ok: false,
        message: "Something went wrong. Please try again.",
      };
    }

    return {
      ok: true,
      message: "Welcome back — you're subscribed again.",
    };
  }

  const { error: insertError } = await supabase
    .from("newsletter_subscribers")
    .insert({ email, status: "subscribed" });

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        ok: true,
        message: "You're already on the list.",
      };
    }

    console.error("[newsletter] insert failed", insertError.message);
    return {
      ok: false,
      message: "Something went wrong. Please try again.",
    };
  }

  return {
    ok: true,
    message: "Thanks — we'll be in touch.",
  };
}

export { SUBSCRIBE_INITIAL_STATE };
