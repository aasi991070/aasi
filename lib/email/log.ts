import { assertOk } from "@/lib/errors";
import { createServiceClient } from "@/lib/supabase/service";
import type { EmailLogEntry, EmailTemplateName } from "@/types";

function mapEmailLog(row: Record<string, unknown>): EmailLogEntry {
  return {
    id: String(row.id),
    order_id: row.order_id != null ? String(row.order_id) : null,
    to_email: String(row.to_email),
    template: row.template as EmailTemplateName,
    status: row.status as EmailLogEntry["status"],
    provider_id: row.provider_id != null ? String(row.provider_id) : null,
    error: row.error != null ? String(row.error) : null,
    created_at: String(row.created_at),
  };
}

export async function insertEmailLog(input: {
  orderId?: string | null;
  toEmail: string;
  template: EmailTemplateName;
  status: "sent" | "failed";
  providerId?: string | null;
  error?: string | null;
}): Promise<EmailLogEntry | null> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("email_log")
    .insert({
      order_id: input.orderId ?? null,
      to_email: input.toEmail.toLowerCase(),
      template: input.template,
      status: input.status,
      provider_id: input.providerId ?? null,
      error: input.error ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST205") {
      console.warn("[email] email_log table missing — skipping log write");
      return null;
    }
    console.error("[email] failed to write email_log", error.message);
    return null;
  }

  return mapEmailLog(data);
}

export async function getFailedEmailLogs(limit = 50): Promise<EmailLogEntry[]> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("email_log")
    .select("*")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "PGRST205") {
      return [];
    }
    assertOk("emailLog.failed", { data: null, error });
  }

  return (data ?? []).map(mapEmailLog);
}

export async function getEmailLogById(id: string): Promise<EmailLogEntry | null> {
  const service = createServiceClient();
  const row = assertOk(
    "emailLog.byId",
    await service.from("email_log").select("*").eq("id", id).maybeSingle()
  );

  return row ? mapEmailLog(row) : null;
}

export async function hasSentEmailTemplate(
  orderId: string,
  template: EmailTemplateName
): Promise<boolean> {
  const service = createServiceClient();
  const { count, error } = await service
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("template", template)
    .eq("status", "sent");

  if (error) {
    if (error.code === "PGRST205") {
      return false;
    }
    assertOk("emailLog.sentCheck", { data: null, error });
  }

  return (count ?? 0) > 0;
}
