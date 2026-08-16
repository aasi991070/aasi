import { Badge } from "@/components/ui/badge";
import type { OrderPaymentStatus, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  packed: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  returned: "outline",
};

const PAYMENT_LABELS: Record<OrderPaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  partially_refunded: "Partial refund",
};

const PAYMENT_VARIANT: Record<
  OrderPaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  unpaid: "secondary",
  paid: "default",
  failed: "destructive",
  refunded: "outline",
  partially_refunded: "outline",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

export function PaymentStatusBadge({
  status,
}: {
  status: OrderPaymentStatus;
}) {
  return (
    <Badge variant={PAYMENT_VARIANT[status]}>{PAYMENT_LABELS[status]}</Badge>
  );
}
