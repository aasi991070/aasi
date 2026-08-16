import { BRAND_NAME } from "@/constants";
import { loadOrderEmailContext } from "@/lib/email/order-context";
import { sendEmail } from "@/lib/email/send";
import {
  ContactReceiptEmail,
  OrderCancelledEmail,
  OrderConfirmationEmail,
  OrderDeliveredEmail,
  OrderRefundedEmail,
  OrderShippedEmail,
  PaymentFailedEmail,
  ReviewRequestEmail,
} from "@/lib/email/templates/transactional";

export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  const context = await loadOrderEmailContext(orderId);
  if (!context) return;

  await sendEmail({
    template: "order_confirmation",
    to: context.customerEmail,
    subject: `${BRAND_NAME} order ${context.orderNumber} confirmed`,
    react: OrderConfirmationEmail(context),
    orderId,
  });
}

export async function sendPaymentFailedEmail(orderId: string): Promise<void> {
  const context = await loadOrderEmailContext(orderId);
  if (!context) return;

  await sendEmail({
    template: "payment_failed",
    to: context.customerEmail,
    subject: `${BRAND_NAME} payment failed for order ${context.orderNumber}`,
    react: PaymentFailedEmail(context),
    orderId,
  });
}

export async function sendOrderShippedEmail(orderId: string): Promise<void> {
  const context = await loadOrderEmailContext(orderId);
  if (!context) return;

  await sendEmail({
    template: "order_shipped",
    to: context.customerEmail,
    subject: `${BRAND_NAME} order ${context.orderNumber} has shipped`,
    react: OrderShippedEmail(context),
    orderId,
  });
}

export async function sendOrderDeliveredEmail(orderId: string): Promise<void> {
  const context = await loadOrderEmailContext(orderId);
  if (!context) return;

  await sendEmail({
    template: "order_delivered",
    to: context.customerEmail,
    subject: `${BRAND_NAME} order ${context.orderNumber} delivered`,
    react: OrderDeliveredEmail(context),
    orderId,
  });
}

export async function sendOrderCancelledEmail(orderId: string): Promise<void> {
  const context = await loadOrderEmailContext(orderId);
  if (!context) return;

  await sendEmail({
    template: "order_cancelled",
    to: context.customerEmail,
    subject: `${BRAND_NAME} order ${context.orderNumber} cancelled`,
    react: OrderCancelledEmail(context),
    orderId,
  });
}

export async function sendOrderRefundedEmail(orderId: string): Promise<void> {
  const context = await loadOrderEmailContext(orderId);
  if (!context) return;

  await sendEmail({
    template: "order_refunded",
    to: context.customerEmail,
    subject: `${BRAND_NAME} refund for order ${context.orderNumber}`,
    react: OrderRefundedEmail(context),
    orderId,
  });
}

export async function sendReviewRequestEmail(orderId: string): Promise<void> {
  const context = await loadOrderEmailContext(orderId);
  if (!context) return;

  await sendEmail({
    template: "review_request",
    to: context.customerEmail,
    subject: `How was your ${BRAND_NAME} order?`,
    react: ReviewRequestEmail(context),
    orderId,
  });
}

export async function sendContactReceiptEmail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  await sendEmail({
    template: "contact_receipt",
    to: input.email,
    subject: `${BRAND_NAME} — we received your message`,
    react: ContactReceiptEmail({
      name: input.name,
      message: input.message,
    }),
  });
}
