import { z } from "zod";
import {
  applyPaymentCaptured,
  applyPaymentFailed,
  applyRefundProcessed,
  resolveOrderIdFromNotes,
} from "@/lib/payments/fulfillment";

interface RazorpayEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  notes?: Record<string, unknown>;
  receipt?: string;
  payment_id?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function entityFromPayload(payload: Record<string, unknown>): RazorpayEntity {
  const payment = asRecord(payload.payment);
  const entity = asRecord(payment.entity);
  if (Object.keys(entity).length) {
    return entity as RazorpayEntity;
  }

  const refund = asRecord(payload.refund);
  const refundEntity = asRecord(refund.entity);
  return refundEntity as RazorpayEntity;
}

const webhookEnvelopeSchema = z.object({
  event: z.string(),
  payload: z.record(z.unknown()),
});

export async function handleRazorpayWebhookEvent(
  body: unknown
): Promise<{ handled: boolean }> {
  const parsed = webhookEnvelopeSchema.safeParse(body);
  if (!parsed.success) {
    return { handled: false };
  }

  const { event, payload } = parsed.data;
  const entity = entityFromPayload(payload);
  const rawPayload = payload as Record<string, unknown>;

  switch (event) {
    case "payment.captured": {
      const orderId = await resolveOrderIdFromNotes(
        entity.notes,
        entity.receipt ?? null
      );

      if (!orderId || !entity.id) {
        return { handled: true };
      }

      await applyPaymentCaptured({
        orderId,
        providerPaymentId: entity.id,
        providerOrderId: entity.order_id ?? null,
        amountPaise: Number(entity.amount ?? 0),
        rawPayload,
      });
      return { handled: true };
    }

    case "payment.failed": {
      const orderId = await resolveOrderIdFromNotes(
        entity.notes,
        entity.receipt ?? null
      );

      if (!orderId) {
        return { handled: true };
      }

      await applyPaymentFailed({
        orderId,
        providerPaymentId: entity.id ?? null,
        providerOrderId: entity.order_id ?? null,
        amountPaise: entity.amount != null ? Number(entity.amount) : undefined,
        rawPayload,
      });
      return { handled: true };
    }

    case "refund.processed": {
      const orderId = await resolveOrderIdFromNotes(
        entity.notes,
        entity.receipt ?? null
      );

      if (!orderId) {
        return { handled: true };
      }

      await applyRefundProcessed({
        orderId,
        providerPaymentId: entity.payment_id ?? entity.id ?? null,
        refundAmountPaise: Number(entity.amount ?? 0),
        rawPayload,
      });
      return { handled: true };
    }

    default:
      return { handled: true };
  }
}
