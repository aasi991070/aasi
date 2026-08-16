"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import {
  sendOrderCancelledEmail,
  sendOrderDeliveredEmail,
  sendOrderRefundedEmail,
  sendOrderShippedEmail,
} from "@/lib/email/notifications";
import { orderTotalToPaise } from "@/lib/payments/amount";
import {
  getRazorpayClient,
  isRazorpayConfigured,
} from "@/lib/payments/razorpay";
import { insertOrderEvent } from "@/lib/queries/order-events";
import {
  getAdminOrderByNumber,
  getOrderById,
  getOrderItems,
} from "@/lib/queries/orders";
import {
  getCapturedPaymentForOrder,
} from "@/lib/queries/payments";
import {
  allowedNextStatuses,
  assertOrderTransition,
} from "@/lib/orders/status-machine";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { assertOk } from "@/lib/errors";
import type {
  OrderActionResult,
  OrderItem,
  OrderStatus,
  RefundLineInput,
} from "@/types";

const orderIdSchema = z.string().uuid("Invalid order id");

const statusSchema = z.enum([
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

const shipmentSchema = z.object({
  orderId: orderIdSchema,
  carrier: z.string().trim().min(1, "Carrier is required."),
  awb: z.string().trim().min(1, "AWB / tracking number is required."),
});

const refundLineSchema = z.object({
  orderItemId: z.string().uuid(),
  qty: z.number().int().positive(),
});

const refundSchema = z.object({
  orderId: orderIdSchema,
  lines: z.array(refundLineSchema).optional(),
});

async function fireEmail(
  fn: (orderId: string) => Promise<void>,
  orderId: string
): Promise<void> {
  try {
    await fn(orderId);
  } catch (error) {
    console.warn("[orders] email hook failed:", error);
  }
}

async function restockItems(
  orderId: string,
  items: OrderItem[],
  lines: RefundLineInput[] | undefined,
  reason: "cancel" | "return"
): Promise<void> {
  const service = createServiceClient();
  const targets = lines?.length
    ? lines.map((line) => {
        const item = items.find((row) => row.id === line.orderItemId);
        if (!item?.product_id) {
          throw new Error("Invalid refund line item.");
        }
        if (line.qty > item.qty) {
          throw new Error("Refund quantity exceeds ordered quantity.");
        }
        return {
          productId: item.product_id,
          variantId: item.variant_id ?? null,
          qty: line.qty,
        };
      })
    : items
        .filter((item) => item.product_id)
        .map((item) => ({
          productId: item.product_id!,
          variantId: item.variant_id ?? null,
          qty: item.qty,
        }));

  for (const target of targets) {
    const { error } = await service.rpc("restock", {
      p_variant_id: target.variantId,
      p_product_id: target.productId,
      p_qty: target.qty,
      p_order_id: orderId,
      p_reason: reason,
    });

    if (error) {
      throw error;
    }
  }
}

function computeRefundAmount(
  orderTotal: number,
  items: OrderItem[],
  lines?: RefundLineInput[]
): number {
  if (!lines?.length) {
    return orderTotal;
  }

  return lines.reduce((sum, line) => {
    const item = items.find((row) => row.id === line.orderItemId);
    if (!item) {
      throw new Error("Invalid refund line item.");
    }
    return sum + item.unit_price * line.qty;
  }, 0);
}

async function issueRazorpayRefund(
  providerPaymentId: string,
  amountInr: number
): Promise<Record<string, unknown>> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured.");
  }

  const razorpay = getRazorpayClient();
  const amountPaise = orderTotalToPaise(amountInr);
  const refund = await razorpay.payments.refund(providerPaymentId, {
    amount: amountPaise,
  });

  return refund as unknown as Record<string, unknown>;
}

async function recordRefundPayment(input: {
  orderId: string;
  providerPaymentId: string;
  refundId?: string | null;
  amount: number;
  status: "refunded" | "partially_refunded";
  rawPayload: Record<string, unknown>;
}): Promise<void> {
  const service = createServiceClient();
  assertOk(
    "orders.refundPayment",
    await service.from("payments").insert({
      order_id: input.orderId,
      provider: "razorpay",
      provider_payment_id: input.refundId ?? null,
      amount: input.amount,
      status: input.status,
      raw_payload: {
        ...input.rawPayload,
        source_payment_id: input.providerPaymentId,
      },
    })
  );
}

async function applyOrderTransition(input: {
  orderId: string;
  actorId: string;
  toStatus: OrderStatus;
  payload?: Record<string, unknown>;
}): Promise<OrderActionResult> {
  const order = await getOrderById(input.orderId);
  if (!order) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Order not found." },
    };
  }

  const transitionError = assertOrderTransition(order.status, input.toStatus);
  if (transitionError) {
    return {
      ok: false,
      error: {
        code: transitionError.code,
        message: transitionError.message,
      },
    };
  }

  const supabase = await createClient();
  assertOk(
    "orders.updateStatus",
    await supabase
      .from("orders")
      .update({ status: input.toStatus })
      .eq("id", order.id)
  );

  await insertOrderEvent({
    orderId: order.id,
    actorId: input.actorId,
    fromStatus: order.status,
    toStatus: input.toStatus,
    eventType: "status_change",
    payload: input.payload ?? null,
  });

  if (input.toStatus === "shipped") {
    await fireEmail(sendOrderShippedEmail, order.id);
  } else if (input.toStatus === "delivered") {
    await fireEmail(sendOrderDeliveredEmail, order.id);
  } else if (input.toStatus === "cancelled") {
    await fireEmail(sendOrderCancelledEmail, order.id);
  }

  revalidatePath("/admin/dashboard/orders");
  revalidatePath(`/admin/dashboard/orders/${order.order_number}`);

  return { ok: true };
}

export async function updateOrderStatusAction(input: {
  orderId: string;
  status: OrderStatus;
}): Promise<OrderActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: admin.message } };
  }

  const parsed = z
    .object({ orderId: orderIdSchema, status: statusSchema })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "Invalid status update." },
    };
  }

  try {
    return await applyOrderTransition({
      orderId: parsed.data.orderId,
      actorId: admin.userId,
      toStatus: parsed.data.status,
    });
  } catch (error) {
    console.error("[updateOrderStatusAction]", error);
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Could not update the order status.",
      },
    };
  }
}

export async function addShipmentAction(input: {
  orderId: string;
  carrier: string;
  awb: string;
}): Promise<OrderActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: admin.message } };
  }

  const parsed = shipmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message ?? "Invalid shipment details.",
      },
    };
  }

  const order = await getOrderById(parsed.data.orderId);
  if (!order) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Order not found." },
    };
  }

  const transitionError = assertOrderTransition(order.status, "shipped");
  if (transitionError) {
    return {
      ok: false,
      error: {
        code: transitionError.code,
        message: transitionError.message,
      },
    };
  }

  try {
    const supabase = await createClient();
    const shippedAt = new Date().toISOString();

    assertOk(
      "orders.insertShipment",
      await supabase.from("shipments").insert({
        order_id: order.id,
        carrier: parsed.data.carrier,
        awb: parsed.data.awb,
        status: "shipped",
        shipped_at: shippedAt,
      })
    );

    return await applyOrderTransition({
      orderId: order.id,
      actorId: admin.userId,
      toStatus: "shipped",
      payload: {
        carrier: parsed.data.carrier,
        awb: parsed.data.awb,
      },
    });
  } catch (error) {
    console.error("[addShipmentAction]", error);
    return {
      ok: false,
      error: { code: "UNKNOWN", message: "Could not add the shipment." },
    };
  }
}

export async function cancelOrderAction(
  orderIdInput: unknown
): Promise<OrderActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: admin.message } };
  }

  const parsed = orderIdSchema.safeParse(orderIdInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "Invalid order." },
    };
  }

  const order = await getOrderById(parsed.data);
  if (!order) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Order not found." },
    };
  }

  const transitionError = assertOrderTransition(order.status, "cancelled");
  if (transitionError) {
    return {
      ok: false,
      error: {
        code: transitionError.code,
        message: transitionError.message,
      },
    };
  }

  try {
    const items = await getOrderItems(order.id);

    if (order.payment_status === "paid" || order.payment_status === "partially_refunded") {
      const captured = await getCapturedPaymentForOrder(order.id);
      if (!captured?.provider_payment_id) {
        return {
          ok: false,
          error: {
            code: "PAYMENT_MISSING",
            message: "No captured payment found to refund.",
          },
        };
      }

      const refundPayload = await issueRazorpayRefund(
        captured.provider_payment_id,
        Number(order.total)
      );

      await recordRefundPayment({
        orderId: order.id,
        providerPaymentId: captured.provider_payment_id,
        refundId:
          typeof refundPayload.id === "string" ? refundPayload.id : null,
        amount: Number(order.total),
        status: "refunded",
        rawPayload: refundPayload,
      });

      const service = createServiceClient();
      assertOk(
        "orders.cancelPaymentStatus",
        await service
          .from("orders")
          .update({ payment_status: "refunded" })
          .eq("id", order.id)
      );

      await restockItems(order.id, items, undefined, "cancel");
    }

    const result = await applyOrderTransition({
      orderId: order.id,
      actorId: admin.userId,
      toStatus: "cancelled",
    });

    return result;
  } catch (error) {
    console.error("[cancelOrderAction]", error);
    return {
      ok: false,
      error: { code: "UNKNOWN", message: "Could not cancel the order." },
    };
  }
}

export async function refundOrderAction(input: {
  orderId: string;
  lines?: RefundLineInput[];
}): Promise<OrderActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: admin.message } };
  }

  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "Invalid refund request." },
    };
  }

  const order = await getOrderById(parsed.data.orderId);
  if (!order) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Order not found." },
    };
  }

  if (
    order.payment_status !== "paid" &&
    order.payment_status !== "partially_refunded"
  ) {
    return {
      ok: false,
      error: {
        code: "NOT_REFUNDABLE",
        message: "This order has no payment to refund.",
      },
    };
  }

  try {
    const items = await getOrderItems(order.id);
    const refundAmount = computeRefundAmount(
      Number(order.total),
      items,
      parsed.data.lines
    );

    if (refundAmount <= 0 || refundAmount > Number(order.total) + 0.001) {
      return {
        ok: false,
        error: {
          code: "INVALID_AMOUNT",
          message: "Refund amount is invalid.",
        },
      };
    }

    const captured = await getCapturedPaymentForOrder(order.id);
    if (!captured?.provider_payment_id) {
      return {
        ok: false,
        error: {
          code: "PAYMENT_MISSING",
          message: "No captured payment found to refund.",
        },
      };
    }

    const isPartial = refundAmount + 0.001 < Number(order.total);
    const paymentStatus = isPartial ? "partially_refunded" : "refunded";
    const refundPayload = await issueRazorpayRefund(
      captured.provider_payment_id,
      refundAmount
    );

    await recordRefundPayment({
      orderId: order.id,
      providerPaymentId: captured.provider_payment_id,
      refundId:
        typeof refundPayload.id === "string" ? refundPayload.id : null,
      amount: refundAmount,
      status: paymentStatus,
      rawPayload: refundPayload,
    });

    const service = createServiceClient();
    assertOk(
      "orders.refundPaymentStatus",
      await service
        .from("orders")
        .update({ payment_status: paymentStatus })
        .eq("id", order.id)
    );

    await restockItems(order.id, items, parsed.data.lines, "return");

    await insertOrderEvent({
      orderId: order.id,
      actorId: admin.userId,
      eventType: "refund",
      payload: {
        amount: refundAmount,
        lines: parsed.data.lines ?? null,
        payment_status: paymentStatus,
      },
    });

    await fireEmail(sendOrderRefundedEmail, order.id);

    revalidatePath("/admin/dashboard/orders");
    revalidatePath(`/admin/dashboard/orders/${order.order_number}`);

    return { ok: true, message: "Refund processed." };
  } catch (error) {
    console.error("[refundOrderAction]", error);
    return {
      ok: false,
      error: { code: "UNKNOWN", message: "Could not process the refund." },
    };
  }
}

export async function getAllowedOrderStatusesAction(
  orderIdInput: unknown
): Promise<{ ok: true; statuses: OrderStatus[] } | OrderActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: admin.message } };
  }

  const parsed = orderIdSchema.safeParse(orderIdInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "Invalid order." },
    };
  }

  const order = await getOrderById(parsed.data);
  if (!order) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Order not found." },
    };
  }

  return { ok: true, statuses: allowedNextStatuses(order.status) };
}

export async function getAdminOrderByNumberAction(
  orderNumberInput: unknown
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { ok: false as const, error: { message: admin.message } };
  }

  const orderNumber = z.string().trim().min(1).safeParse(orderNumberInput);
  if (!orderNumber.success) {
    return { ok: false as const, error: { message: "Invalid order number." } };
  }

  const order = await getAdminOrderByNumber(orderNumber.data);
  if (!order) {
    return { ok: false as const, error: { message: "Order not found." } };
  }

  return { ok: true as const, order };
}
