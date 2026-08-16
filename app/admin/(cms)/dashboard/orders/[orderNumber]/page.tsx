import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderDetailClient } from "@/components/admin/OrderDetailClient";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { getOrderEvents } from "@/lib/queries/order-events";
import {
  getAdminOrderByNumber,
  getOrderItems,
} from "@/lib/queries/orders";
import { getPaymentsForOrder } from "@/lib/queries/payments";
import { getShipmentsByOrderId } from "@/lib/queries/shipments";

interface AdminOrderDetailPageProps {
  params: {
    orderNumber: string;
  };
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const orderNumber = decodeURIComponent(params.orderNumber);
  const order = await getAdminOrderByNumber(orderNumber);

  if (!order) {
    notFound();
  }

  const [items, payments, shipments, events] = await Promise.all([
    getOrderItems(order.id),
    getPaymentsForOrder(order.id),
    getShipmentsByOrderId(order.id),
    getOrderEvents(order.id),
  ]);

  return (
    <>
      <PageHeader
        surface="admin"
        as="h1"
        title={`Order ${order.order_number}`}
        subtitle="Fulfilment, payments, and audit trail"
        variant="onGradient"
        action={
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/admin/dashboard/orders">
              <ArrowLeft className="mr-2 size-4" />
              Back to orders
            </Link>
          </Button>
        }
      />

      <OrderDetailClient
        order={order}
        items={items}
        payments={payments}
        shipments={shipments}
        events={events}
      />
    </>
  );
}
