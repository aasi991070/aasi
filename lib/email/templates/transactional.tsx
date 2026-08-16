import { Link, Text } from "@react-email/components";
import {
  EmailLayout,
  OrderLinesSection,
  styles,
} from "@/lib/email/templates/layout";
import type { OrderEmailContext } from "@/lib/email/order-context";

export function OrderConfirmationEmail(props: OrderEmailContext) {
  return (
    <EmailLayout
      preview={`Order ${props.orderNumber} confirmed`}
      title="Thank you for your order"
    >
      <Text style={styles.paragraph}>
        Hi {props.customerName}, we received your payment for order{" "}
        <span style={styles.strong}>{props.orderNumber}</span>.
      </Text>
      <OrderLinesSection
        lines={props.lines}
        subtotal={props.subtotal}
        discount={props.discount}
        shippingFee={props.shippingFee}
        tax={props.tax}
        total={props.total}
      />
      <Text style={styles.paragraph}>
        Track your order at{" "}
        <Link href={props.orderUrl} style={styles.link}>
          {props.orderUrl}
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}

export function PaymentFailedEmail(props: OrderEmailContext) {
  return (
    <EmailLayout
      preview={`Payment failed for order ${props.orderNumber}`}
      title="Payment could not be completed"
    >
      <Text style={styles.paragraph}>
        Hi {props.customerName}, we could not confirm payment for order{" "}
        <span style={styles.strong}>{props.orderNumber}</span> ({props.total}).
      </Text>
      <Text style={styles.paragraph}>
        You can retry from your order page:{" "}
        <Link href={props.orderUrl} style={styles.link}>
          {props.orderUrl}
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}

export function OrderShippedEmail(props: OrderEmailContext) {
  return (
    <EmailLayout
      preview={`Order ${props.orderNumber} has shipped`}
      title="Your order is on its way"
    >
      <Text style={styles.paragraph}>
        Hi {props.customerName}, order{" "}
        <span style={styles.strong}>{props.orderNumber}</span> has shipped
        {props.shipment?.carrier ? ` via ${props.shipment.carrier}` : ""}.
      </Text>
      {props.shipment?.awb ? (
        <Text style={styles.paragraph}>
          Tracking / AWB:{" "}
          <span style={styles.strong}>{props.shipment.awb}</span>
        </Text>
      ) : null}
      <Text style={styles.paragraph}>
        View details:{" "}
        <Link href={props.orderUrl} style={styles.link}>
          {props.orderUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

export function OrderDeliveredEmail(props: OrderEmailContext) {
  return (
    <EmailLayout
      preview={`Order ${props.orderNumber} delivered`}
      title="Your order has been delivered"
    >
      <Text style={styles.paragraph}>
        Hi {props.customerName}, order{" "}
        <span style={styles.strong}>{props.orderNumber}</span> is marked as
        delivered. We hope you love your purchase.
      </Text>
      <Text style={styles.paragraph}>
        Share a review from your order page when you are ready:{" "}
        <Link href={props.orderUrl} style={styles.link}>
          {props.orderUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

export function OrderCancelledEmail(props: OrderEmailContext) {
  return (
    <EmailLayout
      preview={`Order ${props.orderNumber} cancelled`}
      title="Your order was cancelled"
    >
      <Text style={styles.paragraph}>
        Hi {props.customerName}, order{" "}
        <span style={styles.strong}>{props.orderNumber}</span> has been
        cancelled. Any eligible refund will return to your original payment
        method.
      </Text>
    </EmailLayout>
  );
}

export function OrderRefundedEmail(props: OrderEmailContext) {
  return (
    <EmailLayout
      preview={`Refund processed for order ${props.orderNumber}`}
      title="Your refund is on its way"
    >
      <Text style={styles.paragraph}>
        Hi {props.customerName}, we processed a refund for order{" "}
        <span style={styles.strong}>{props.orderNumber}</span>. It may take a
        few business days to appear on your statement.
      </Text>
    </EmailLayout>
  );
}

export function ReviewRequestEmail(props: OrderEmailContext) {
  return (
    <EmailLayout
      preview={`How was order ${props.orderNumber}?`}
      title="Tell us what you think"
    >
      <Text style={styles.paragraph}>
        Hi {props.customerName}, it has been a week since order{" "}
        <span style={styles.strong}>{props.orderNumber}</span> arrived. If you
        have a moment, we would love a review of the items you purchased.
      </Text>
      <Text style={styles.paragraph}>
        Open your order to leave a verified review:{" "}
        <Link href={props.orderUrl} style={styles.link}>
          {props.orderUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

export function ContactReceiptEmail(props: {
  name: string;
  message: string;
}) {
  return (
    <EmailLayout
      preview="We received your message"
      title="Thanks for reaching out"
    >
      <Text style={styles.paragraph}>Hi {props.name},</Text>
      <Text style={styles.paragraph}>
        We received your message and will reply as soon as we can. Here is a
        copy for your records:
      </Text>
      <Text style={{ ...styles.paragraph, whiteSpace: "pre-wrap" }}>
        {props.message}
      </Text>
    </EmailLayout>
  );
}
