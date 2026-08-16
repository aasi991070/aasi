import { assertOk } from "@/lib/errors";
import { createServiceClient } from "@/lib/supabase/service";
import type { Payment, PaymentStatus } from "@/types";

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    provider: row.provider as Payment["provider"],
    provider_order_id:
      row.provider_order_id != null ? String(row.provider_order_id) : null,
    provider_payment_id:
      row.provider_payment_id != null ? String(row.provider_payment_id) : null,
    provider_signature:
      row.provider_signature != null ? String(row.provider_signature) : null,
    amount: Number(row.amount),
    status: row.status as PaymentStatus,
    raw_payload:
      row.raw_payload != null
        ? (row.raw_payload as Record<string, unknown>)
        : null,
    created_at: String(row.created_at),
  };
}

export async function insertCreatedPayment(input: {
  orderId: string;
  providerOrderId: string;
  amount: number;
}): Promise<Payment> {
  const service = createServiceClient();
  const created = assertOk(
    "payments.insertCreated",
    await service
      .from("payments")
      .insert({
        order_id: input.orderId,
        provider: "razorpay",
        provider_order_id: input.providerOrderId,
        amount: input.amount,
        status: "created",
      })
      .select("*")
      .single()
  );

  return mapPayment(created);
}

export async function getLatestPaymentForOrder(
  orderId: string
): Promise<Payment | null> {
  const service = createServiceClient();
  const row = assertOk(
    "payments.latestForOrder",
    await service
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  );

  return row ? mapPayment(row) : null;
}
