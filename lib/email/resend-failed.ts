import { BRAND_NAME } from "@/constants";
import { loadOrderEmailContext } from "@/lib/email/order-context";
import { sendEmail } from "@/lib/email/send";
import {
  OrderCancelledEmail,
  OrderConfirmationEmail,
  OrderDeliveredEmail,
  OrderRefundedEmail,
  OrderShippedEmail,
  PaymentFailedEmail,
  ReviewRequestEmail,
} from "@/lib/email/templates/transactional";
import type { EmailLogEntry, EmailTemplateName } from "@/types";

const ORDER_TEMPLATE_SUBJECTS: Record<
  Exclude<EmailTemplateName, "contact_receipt">,
  (orderNumber: string) => string
> = {
  order_confirmation: (orderNumber) =>
    `${BRAND_NAME} order ${orderNumber} confirmed`,
  payment_failed: (orderNumber) =>
    `${BRAND_NAME} payment failed for order ${orderNumber}`,
  order_shipped: (orderNumber) =>
    `${BRAND_NAME} order ${orderNumber} has shipped`,
  order_delivered: (orderNumber) =>
    `${BRAND_NAME} order ${orderNumber} delivered`,
  order_cancelled: (orderNumber) =>
    `${BRAND_NAME} order ${orderNumber} cancelled`,
  order_refunded: (orderNumber) =>
    `${BRAND_NAME} refund for order ${orderNumber}`,
  review_request: () => `How was your ${BRAND_NAME} order?`,
};

export async function resendFailedEmail(entry: EmailLogEntry): Promise<void> {
  if (entry.template === "contact_receipt") {
    throw new Error("Contact receipt emails cannot be resent without the original message.");
  }

  if (!entry.order_id) {
    throw new Error("Missing order context for this email.");
  }

  const context = await loadOrderEmailContext(entry.order_id);
  if (!context) {
    throw new Error("Order not found for resend.");
  }

  const subject = ORDER_TEMPLATE_SUBJECTS[entry.template](context.orderNumber);

  const react = (() => {
    switch (entry.template) {
      case "order_confirmation":
        return OrderConfirmationEmail(context);
      case "payment_failed":
        return PaymentFailedEmail(context);
      case "order_shipped":
        return OrderShippedEmail(context);
      case "order_delivered":
        return OrderDeliveredEmail(context);
      case "order_cancelled":
        return OrderCancelledEmail(context);
      case "order_refunded":
        return OrderRefundedEmail(context);
      case "review_request":
        return ReviewRequestEmail(context);
      default: {
        const unreachable: never = entry.template;
        return unreachable;
      }
    }
  })();

  await sendEmail({
    template: entry.template,
    to: entry.to_email,
    subject,
    react,
    orderId: entry.order_id,
  });
}
