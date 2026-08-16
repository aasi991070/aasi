import { NextResponse } from "next/server";
import { hasSentEmailTemplate } from "@/lib/email/log";
import { sendReviewRequestEmail } from "@/lib/email/notifications";
import { assertOk } from "@/lib/errors";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Vercel Cron (see vercel.json) hits this route daily.
 * Set CRON_SECRET in Vercel — the platform sends `Authorization: Bearer …`.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const rows = assertOk(
    "cron.reviewRequests.orders",
    await service
      .from("orders")
      .select("id")
      .eq("status", "delivered")
      .lte("updated_at", cutoff.toISOString())
  );

  let sent = 0;

  for (const row of rows ?? []) {
    const orderId = String(row.id);
    const alreadySent = await hasSentEmailTemplate(orderId, "review_request");
    if (alreadySent) {
      continue;
    }

    try {
      await sendReviewRequestEmail(orderId);
      sent += 1;
    } catch (error) {
      console.warn("[cron/review-requests] send failed", orderId, error);
    }
  }

  return NextResponse.json({ processed: rows?.length ?? 0, sent });
}
