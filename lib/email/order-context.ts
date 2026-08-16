import { BRAND_NAME, SITE_URL } from "@/constants";
import { getOrderById, getOrderItems } from "@/lib/queries/orders";
import { getShipmentByOrderId } from "@/lib/queries/shipments";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { Order, OrderItem, Shipment } from "@/types";

export interface OrderEmailLine {
  name: string;
  qty: number;
  lineTotal: string;
}

export interface OrderEmailContext {
  brandName: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderUrl: string;
  subtotal: string;
  discount: string;
  shippingFee: string;
  tax: string;
  total: string;
  lines: OrderEmailLine[];
  shipment?: {
    carrier?: string | null;
    awb?: string | null;
  };
}

export async function loadOrderEmailContext(
  orderId: string
): Promise<OrderEmailContext | null> {
  const order = await getOrderById(orderId);
  if (!order) {
    return null;
  }

  const [items, shipment] = await Promise.all([
    getOrderItems(orderId),
    getShipmentByOrderId(orderId),
  ]);

  return buildOrderEmailContext(order, items, shipment);
}

export function buildOrderEmailContext(
  order: Order,
  items: OrderItem[],
  shipment?: Shipment | null
): OrderEmailContext {
  return {
    brandName: BRAND_NAME,
    orderNumber: order.order_number,
    customerName: order.shipping_address.name,
    customerEmail: order.email,
    orderUrl: `${SITE_URL}/order/${encodeURIComponent(order.order_number)}`,
    subtotal: formatPrice(order.subtotal),
    discount: formatPrice(order.discount),
    shippingFee: formatPrice(order.shipping_fee),
    tax: formatPrice(order.tax),
    total: formatPrice(order.total),
    lines: items.map((item) => ({
      name: item.name_snapshot,
      qty: item.qty,
      lineTotal: formatPrice(item.line_total),
    })),
    shipment: shipment
      ? {
          carrier: shipment.carrier,
          awb: shipment.awb,
        }
      : undefined,
  };
}
