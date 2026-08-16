"use server";

import { orderTotalToPaise } from "@/lib/payments/amount";
import {
  applyPaymentCaptured,
  applyPaymentFailed,
} from "@/lib/payments/fulfillment";
import {
  getRazorpayClient,
  getRazorpayPublicKey,
  isRazorpayConfigured,
} from "@/lib/payments/razorpay";
import { getLatestPaymentForOrder, insertCreatedPayment } from "@/lib/queries/payments";
import { getOrderById, getOrderByNumber } from "@/lib/queries/orders";
import { z } from "zod";

const orderIdSchema = z.string().uuid("Invalid order id");
const orderNumberSchema = z.string().trim().min(1, "Invalid order number");

export type CreatePaymentResult =
  | {
      ok: true;
      data: {
        keyId: string;
        razorpayOrderId: string;
        amount: number;
        orderId: string;
        orderNumber: string;
        prefill: {
          name: string;
          email: string;
          contact: string;
        };
      };
    }
  | { ok: false; error: { message: string } };

export type VerifyPaymentResult =
  | {
      ok: true;
      data: {
        status: "processing" | "confirmed" | "failed";
        orderNumber: string;
      };
    }
  | { ok: false; error: { message: string } };

export async function createPaymentAction(
  orderIdInput: unknown
): Promise<CreatePaymentResult> {
  const parsed = orderIdSchema.safeParse(orderIdInput);
  if (!parsed.success) {
    return { ok: false, error: { message: "Invalid order." } };
  }

  if (!isRazorpayConfigured()) {
    return {
      ok: false,
      error: {
        message: "Payments are not configured yet. Add Razorpay keys to continue.",
      },
    };
  }

  try {
    const order = await getOrderById(parsed.data);
    if (!order) {
      return { ok: false, error: { message: "Order not found." } };
    }

    if (order.payment_status !== "unpaid") {
      return {
        ok: false,
        error: { message: "This order is not awaiting payment." },
      };
    }

    const amount = orderTotalToPaise(order.total);
    const razorpay = getRazorpayClient();

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: order.order_number,
      notes: { orderId: order.id },
    });

    await insertCreatedPayment({
      orderId: order.id,
      providerOrderId: razorpayOrder.id,
      amount: order.total,
    });

    const shippingName = order.shipping_address.name;
    const contact = order.phone ?? order.shipping_address.phone ?? "";

    return {
      ok: true,
      data: {
        keyId: getRazorpayPublicKey(),
        razorpayOrderId: razorpayOrder.id,
        amount,
        orderId: order.id,
        orderNumber: order.order_number,
        prefill: {
          name: shippingName,
          email: order.email,
          contact,
        },
      },
    };
  } catch (error) {
    console.error("[createPaymentAction]", error);
    return {
      ok: false,
      error: { message: "Could not start payment. Please try again." },
    };
  }
}

export async function verifyPaymentAction(input: {
  orderNumber: string;
  paymentId?: string;
}): Promise<VerifyPaymentResult> {
  const orderNumber = orderNumberSchema.safeParse(input.orderNumber);
  if (!orderNumber.success) {
    return { ok: false, error: { message: "Invalid order." } };
  }

  try {
    const order = await getOrderByNumber(orderNumber.data);
    if (!order) {
      return { ok: false, error: { message: "Order not found." } };
    }

    if (order.payment_status === "paid") {
      return {
        ok: true,
        data: { status: "confirmed", orderNumber: order.order_number },
      };
    }

    if (order.payment_status === "failed") {
      return {
        ok: true,
        data: { status: "failed", orderNumber: order.order_number },
      };
    }

    if (!isRazorpayConfigured()) {
      return {
        ok: true,
        data: { status: "processing", orderNumber: order.order_number },
      };
    }

    const razorpay = getRazorpayClient();
    const paymentId =
      input.paymentId ??
      (await getLatestPaymentForOrder(order.id))?.provider_payment_id ??
      undefined;

    if (!paymentId) {
      const latest = await getLatestPaymentForOrder(order.id);
      const providerOrderId = latest?.provider_order_id;

      if (providerOrderId) {
        const payments = await razorpay.orders.fetchPayments(providerOrderId);
        const captured = payments.items?.find(
          (item) => item.status === "captured"
        );

        if (captured?.id) {
          await applyPaymentCaptured({
            orderId: order.id,
            providerPaymentId: captured.id,
            providerOrderId,
            amountPaise: Number(captured.amount),
            rawPayload: captured as unknown as Record<string, unknown>,
          });

          return {
            ok: true,
            data: { status: "confirmed", orderNumber: order.order_number },
          };
        }

        const failed = payments.items?.find((item) => item.status === "failed");
        if (failed?.id) {
          await applyPaymentFailed({
            orderId: order.id,
            providerPaymentId: failed.id,
            providerOrderId,
            amountPaise: Number(failed.amount),
            rawPayload: failed as unknown as Record<string, unknown>,
          });

          return {
            ok: true,
            data: { status: "failed", orderNumber: order.order_number },
          };
        }
      }

      return {
        ok: true,
        data: { status: "processing", orderNumber: order.order_number },
      };
    }

    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status === "captured") {
      await applyPaymentCaptured({
        orderId: order.id,
        providerPaymentId: payment.id,
        providerOrderId: payment.order_id ?? null,
        amountPaise: Number(payment.amount),
        rawPayload: payment as unknown as Record<string, unknown>,
      });

      return {
        ok: true,
        data: { status: "confirmed", orderNumber: order.order_number },
      };
    }

    if (payment.status === "failed") {
      await applyPaymentFailed({
        orderId: order.id,
        providerPaymentId: payment.id,
        providerOrderId: payment.order_id ?? null,
        amountPaise: Number(payment.amount),
        rawPayload: payment as unknown as Record<string, unknown>,
      });

      return {
        ok: true,
        data: { status: "failed", orderNumber: order.order_number },
      };
    }

    return {
      ok: true,
      data: { status: "processing", orderNumber: order.order_number },
    };
  } catch (error) {
    console.error("[verifyPaymentAction]", error);
    return {
      ok: false,
      error: { message: "Could not verify payment status." },
    };
  }
}
