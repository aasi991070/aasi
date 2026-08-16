"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { AdminOrderListItem } from "@/types";

interface OrderTableProps {
  orders: AdminOrderListItem[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrderTable({ orders }: OrderTableProps) {
  return (
    <div className="v18-card overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Fulfilment</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-slate-50">
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>{formatDate(order.created_at)}</TableCell>
              <TableCell>
                <div>{order.email}</div>
                {order.phone ? (
                  <div className="text-xs text-slate-500">{order.phone}</div>
                ) : null}
              </TableCell>
              <TableCell>{order.item_count}</TableCell>
              <TableCell>{formatPrice(order.total)}</TableCell>
              <TableCell>
                <PaymentStatusBadge status={order.payment_status} />
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="icon" className="size-9">
                  <Link
                    href={`/admin/dashboard/orders/${encodeURIComponent(order.order_number)}`}
                    aria-label={`View order ${order.order_number}`}
                  >
                    <Eye className="size-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
