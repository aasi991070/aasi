import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderStatusClient } from "@/components/storefront/order/OrderStatusClient";
import { getOrderByNumber, getOrderItems } from "@/lib/queries/orders";

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

  return (
    <Suspense fallback={null}>
      <OrderStatusClient order={order} items={items} />
    </Suspense>
  );
}
