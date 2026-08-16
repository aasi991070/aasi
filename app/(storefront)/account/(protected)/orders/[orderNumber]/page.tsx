import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderFulfillmentTimeline } from "@/components/storefront/order/OrderFulfillmentTimeline";
import {
  getCustomerOrderByNumber,
  getCustomerOrderItems,
} from "@/lib/queries/orders";
import { getShipmentByOrderId } from "@/lib/queries/shipments";
import { formatPrice } from "@/lib/utils/formatPrice";

interface AccountOrderDetailPageProps {
  params: {
    orderNumber: string;
  };
}

export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const orderNumber = decodeURIComponent(params.orderNumber);
  const order = await getCustomerOrderByNumber(orderNumber);

  if (!order) {
    notFound();
  }

  const [items, shipment] = await Promise.all([
    getCustomerOrderItems(order.id),
    getShipmentByOrderId(order.id),
  ]);

  return (
    <div>
      <Link
        href="/account/orders"
        className="font-sans text-xs uppercase tracking-[0.15em] text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
      >
        Back to orders
      </Link>

      <h1 className="mt-6 font-display text-3xl text-store-ink">
        Order {order.order_number}
      </h1>
      <p className="mt-2 font-sans text-sm text-store-ink-muted">
        Placed {new Date(order.created_at).toLocaleString("en-IN")} ·{" "}
        {order.payment_status}
      </p>

      <OrderFulfillmentTimeline status={order.status} shipment={shipment} />

      <section className="mt-10 space-y-3">
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
          Items
        </h2>
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between border border-store-border px-4 py-3 font-sans text-sm"
          >
            <span>
              {item.name_snapshot} × {item.qty}
            </span>
            <span>{formatPrice(item.line_total)}</span>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
            Shipping address
          </h2>
          <p className="mt-3 font-sans text-sm text-store-ink-muted">
            {order.shipping_address.name}
            <br />
            {order.shipping_address.line1}
            {order.shipping_address.line2
              ? `, ${order.shipping_address.line2}`
              : ""}
            <br />
            {order.shipping_address.city}, {order.shipping_address.state}{" "}
            {order.shipping_address.pincode}
          </p>
        </div>
        <div id="invoice">
          <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
            Invoice
          </h2>
          <p className="mt-3 font-sans text-sm text-store-ink-muted">
            Total {formatPrice(order.total)}
          </p>
          <p className="mt-4 font-sans text-xs text-store-ink-muted">
            Use your browser&apos;s print command to save this page as an invoice.
          </p>
        </div>
      </section>
    </div>
  );
}
