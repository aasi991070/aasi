import { revalidateTag } from "next/cache";
import { CART_TAG } from "@/lib/cart/constants";
import { setCartCouponCode } from "@/lib/cart/session";
import { assertOk } from "@/lib/errors";
import { paiseToInr } from "@/lib/payments/amount";
import { createServiceClient } from "@/lib/supabase/service";
import type { Order, OrderItem, PaymentStatus } from "@/types";

interface OrderRow extends Order {
  items: OrderItem[];
}

async function loadOrderWithItems(orderId: string): Promise<OrderRow | null> {
  const service = createServiceClient();

  const order = assertOk(
    "fulfillment.order",
    await service.from("orders").select("*").eq("id", orderId).maybeSingle()
  );

  if (!order) {
    return null;
  }

  const items = assertOk(
    "fulfillment.orderItems",
    await service.from("order_items").select("*").eq("order_id", orderId)
  );

  return {
    ...(order as Order),
    items: (items ?? []) as OrderItem[],
  };
}

async function hasInventoryBeenDecremented(orderId: string): Promise<boolean> {
  const service = createServiceClient();
  const { count, error } = await service
    .from("inventory_moves")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("reason", "order");

  if (error) {
    if (error.code === "PGRST205") {
      return false;
    }
    assertOk("fulfillment.inventoryCheck", { data: null, error });
  }

  return (count ?? 0) > 0;
}

async function decrementOrderStock(order: OrderRow): Promise<void> {
  if (await hasInventoryBeenDecremented(order.id)) {
    return;
  }

  const service = createServiceClient();

  for (const item of order.items) {
    if (!item.product_id) {
      continue;
    }

    const { error } = await service.rpc("decrement_stock", {
      p_variant_id: item.variant_id ?? null,
      p_product_id: item.product_id,
      p_qty: item.qty,
      p_order_id: order.id,
    });

    if (error) {
      throw error;
    }
  }
}

async function redeemOrderCoupon(order: OrderRow): Promise<void> {
  if (!order.coupon_code) {
    return;
  }

  const service = createServiceClient();
  const { error } = await service.rpc("redeem_coupon", {
    p_code: order.coupon_code,
  });

  if (error && !String(error.message).includes("usage limit")) {
    console.warn("[fulfillment] redeem_coupon skipped:", error.message);
  }
}

async function convertCartForOrder(order: OrderRow): Promise<void> {
  if (!order.user_id) {
    return;
  }

  const service = createServiceClient();

  const carts = assertOk(
    "fulfillment.activeCarts",
    await service
      .from("carts")
      .select("id")
      .eq("user_id", order.user_id)
      .eq("status", "active")
  );

  for (const cart of carts ?? []) {
    assertOk(
      "fulfillment.clearCartItems",
      await service.from("cart_items").delete().eq("cart_id", cart.id)
    );

    assertOk(
      "fulfillment.convertCart",
      await service
        .from("carts")
        .update({ status: "converted" })
        .eq("id", cart.id)
    );
  }

  await setCartCouponCode(null);
  revalidateTag(CART_TAG);
}

async function upsertPaymentRow(input: {
  orderId: string;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  amount: number;
  status: PaymentStatus;
  rawPayload: Record<string, unknown>;
}): Promise<"inserted" | "duplicate"> {
  const service = createServiceClient();

  if (input.providerPaymentId) {
    const existing = assertOk(
      "fulfillment.paymentLookup",
      await service
        .from("payments")
        .select("id, status")
        .eq("provider_payment_id", input.providerPaymentId)
        .maybeSingle()
    );

    if (existing) {
      if (existing.status === input.status) {
        return "duplicate";
      }

      assertOk(
        "fulfillment.paymentUpdate",
        await service
          .from("payments")
          .update({
            status: input.status,
            provider_order_id: input.providerOrderId ?? undefined,
            amount: input.amount,
            raw_payload: input.rawPayload,
          })
          .eq("id", existing.id)
      );

      return "duplicate";
    }
  }

  const { error } = await service.from("payments").insert({
    order_id: input.orderId,
    provider: "razorpay",
    provider_order_id: input.providerOrderId ?? null,
    provider_payment_id: input.providerPaymentId ?? null,
    amount: input.amount,
    status: input.status,
    raw_payload: input.rawPayload,
  });

  if (error?.code === "23505" && input.providerPaymentId) {
    return "duplicate";
  }

  if (error) {
    throw error;
  }

  return "inserted";
}

export interface ApplyPaymentCapturedInput {
  orderId: string;
  providerPaymentId: string;
  providerOrderId?: string | null;
  amountPaise: number;
  rawPayload: Record<string, unknown>;
}

export async function applyPaymentCaptured(
  input: ApplyPaymentCapturedInput
): Promise<"applied" | "duplicate"> {
  const order = await loadOrderWithItems(input.orderId);
  if (!order) {
    throw new Error(`Order not found: ${input.orderId}`);
  }

  const duplicate = await upsertPaymentRow({
    orderId: order.id,
    providerOrderId: input.providerOrderId,
    providerPaymentId: input.providerPaymentId,
    amount: paiseToInr(input.amountPaise),
    status: "captured",
    rawPayload: input.rawPayload,
  });

  if (order.payment_status === "paid" && order.status === "confirmed") {
    return "duplicate";
  }

  if (duplicate === "duplicate" && order.payment_status === "paid") {
    return "duplicate";
  }

  const service = createServiceClient();
  const placedAt = new Date().toISOString();

  assertOk(
    "fulfillment.orderPaid",
    await service
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        placed_at: placedAt,
      })
      .eq("id", order.id)
  );

  await decrementOrderStock(order);
  await redeemOrderCoupon(order);
  await convertCartForOrder(order);

  return duplicate === "duplicate" ? "duplicate" : "applied";
}

export interface ApplyPaymentFailedInput {
  orderId: string;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  amountPaise?: number;
  rawPayload: Record<string, unknown>;
}

export async function applyPaymentFailed(
  input: ApplyPaymentFailedInput
): Promise<"applied" | "duplicate"> {
  const order = await loadOrderWithItems(input.orderId);
  if (!order) {
    throw new Error(`Order not found: ${input.orderId}`);
  }

  if (input.providerPaymentId) {
    const duplicate = await upsertPaymentRow({
      orderId: order.id,
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      amount: input.amountPaise ? paiseToInr(input.amountPaise) : Number(order.total),
      status: "failed",
      rawPayload: input.rawPayload,
    });

    if (order.payment_status === "failed" && duplicate === "duplicate") {
      return "duplicate";
    }
  }

  if (order.payment_status === "paid") {
    return "duplicate";
  }

  const service = createServiceClient();
  assertOk(
    "fulfillment.orderFailed",
    await service
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", order.id)
  );

  return "applied";
}

export interface ApplyRefundProcessedInput {
  orderId: string;
  providerPaymentId?: string | null;
  refundAmountPaise: number;
  rawPayload: Record<string, unknown>;
}

export async function applyRefundProcessed(
  input: ApplyRefundProcessedInput
): Promise<"applied" | "duplicate"> {
  const order = await loadOrderWithItems(input.orderId);
  if (!order) {
    throw new Error(`Order not found: ${input.orderId}`);
  }

  const refundAmount = paiseToInr(input.refundAmountPaise);
  const orderTotal = Number(order.total);
  const isPartial = refundAmount + 0.001 < orderTotal;
  const paymentStatus = isPartial ? "partially_refunded" : "refunded";
  const paymentRowStatus = isPartial ? "partially_refunded" : "refunded";

  if (input.providerPaymentId) {
    await upsertPaymentRow({
      orderId: order.id,
      providerPaymentId: input.providerPaymentId,
      amount: refundAmount,
      status: paymentRowStatus,
      rawPayload: input.rawPayload,
    });
  }

  if (
    order.payment_status === paymentStatus ||
    order.payment_status === "refunded"
  ) {
    return "duplicate";
  }

  const service = createServiceClient();
  assertOk(
    "fulfillment.orderRefunded",
    await service
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", order.id)
  );

  return "applied";
}

export async function resolveOrderIdFromNotes(
  notes: Record<string, unknown> | undefined,
  receipt?: string | null
): Promise<string | null> {
  const orderId = notes?.orderId;
  if (typeof orderId === "string" && orderId.length) {
    return orderId;
  }

  if (!receipt) {
    return null;
  }

  const service = createServiceClient();
  const order = assertOk(
    "fulfillment.orderByReceipt",
    await service
      .from("orders")
      .select("id")
      .eq("order_number", receipt)
      .maybeSingle()
  );

  return order?.id ? String(order.id) : null;
}
