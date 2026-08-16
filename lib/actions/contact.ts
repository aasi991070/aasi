"use server";

import { headers } from "next/headers";
import { sendContactReceiptEmail } from "@/lib/email/notifications";
import { createServiceClient } from "@/lib/supabase/service";
import { hashClientIpFromHeaders } from "@/lib/security/clientIp";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import {
  CONTACT_INITIAL_STATE,
  contactSchema,
  type ContactFormState,
} from "@/lib/validation/contact";

/** Contact form submissions allowed per IP per hour. */
const CONTACT_RATE_LIMIT = 3;

export async function contactAction(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      ok: false,
      message: first?.message ?? "Please check the form and try again.",
    };
  }

  const ipHash = hashClientIpFromHeaders(await headers());
  if (!ipHash) {
    console.error("REVIEW_IP_SALT is not set; refusing contact submissions.");
    return {
      ok: false,
      message: "Contact form is temporarily unavailable.",
    };
  }

  const withinLimit = await consumeRateLimit(
    "contact",
    ipHash,
    CONTACT_RATE_LIMIT
  );
  if (!withinLimit) {
    return {
      ok: false,
      message: "Too many messages sent. Please try again in an hour.",
    };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    message: parsed.data.message,
  });

  if (error) {
    console.error("[contact] insert failed", error.message);
    return {
      ok: false,
      message: "Something went wrong. Please try again.",
    };
  }

  try {
    await sendContactReceiptEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });
  } catch (emailError) {
    console.warn("[contact] receipt email failed", emailError);
  }

  return {
    ok: true,
    message: "Thank you — we'll reply as soon as we can.",
  };
}

export { CONTACT_INITIAL_STATE };
