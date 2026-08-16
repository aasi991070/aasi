import type { ReactElement } from "react";
import { getOrderFromEmail, getResendClient, isResendConfigured } from "@/lib/email/client";
import { insertEmailLog } from "@/lib/email/log";
import type { EmailTemplateName } from "@/types";

export interface SendEmailInput {
  template: EmailTemplateName;
  to: string;
  subject: string;
  react: ReactElement;
  orderId?: string | null;
}

/**
 * Sends via Resend and records the outcome. Failures are logged and swallowed
 * by callers — email must never roll back commerce state.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!isResendConfigured()) {
    console.warn(`[email] ${input.template} skipped — Resend not configured`);
    await insertEmailLog({
      orderId: input.orderId,
      toEmail: input.to,
      template: input.template,
      status: "failed",
      error: "Resend is not configured",
    });
    return;
  }

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: getOrderFromEmail(),
      to: input.to,
      subject: input.subject,
      react: input.react,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    await insertEmailLog({
      orderId: input.orderId,
      toEmail: input.to,
      template: input.template,
      status: "sent",
      providerId: result.data?.id ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    console.error(`[email] ${input.template} failed`, message);
    await insertEmailLog({
      orderId: input.orderId,
      toEmail: input.to,
      template: input.template,
      status: "failed",
      error: message,
    });
  }
}
