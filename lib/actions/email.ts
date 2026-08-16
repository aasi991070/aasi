"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { getEmailLogById } from "@/lib/email/log";
import { resendFailedEmail } from "@/lib/email/resend-failed";
import type { ActionResult } from "@/lib/validation/catalog";

export async function resendFailedEmailAction(
  emailLogId: string
): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  const entry = await getEmailLogById(emailLogId);
  if (!entry) {
    return { ok: false, message: "Email log entry not found." };
  }

  if (entry.status !== "failed") {
    return { ok: false, message: "Only failed emails can be resent." };
  }

  try {
    await resendFailedEmail(entry);
    revalidatePath("/admin/dashboard/emails");
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[resendFailedEmailAction]", error);
    return { ok: false, message: "Could not resend the email." };
  }
}
