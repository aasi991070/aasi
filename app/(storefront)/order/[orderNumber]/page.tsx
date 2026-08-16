import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderStatusClient } from "@/components/storefront/order/OrderStatusClient";
import { getCustomerUser } from "@/lib/auth/customer";
import { getOrderByNumber, getOrderItems } from "@/lib/queries/orders";
import { getShipmentByOrderId } from "@/lib/queries/shipments";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};

interface OrderPageProps {
  params: {
    orderNumber: string;
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const order = await getOrderByNumber(decodeURIComponent(params.orderNumber));

  if (!order) {
    notFound();
  }

  const items = await getOrderItems(order.id);
  const [shipment, customer] = await Promise.all([
    getShipmentByOrderId(order.id),
    getCustomerUser(),
  ]);

  return (
    <Suspense fallback={null}>
      <OrderStatusClient
        order={order}
        items={items}
        shipment={shipment}
        isSignedInCustomer={Boolean(customer)}
      />
    </Suspense>
  );
}
