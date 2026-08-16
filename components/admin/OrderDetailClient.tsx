"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/OrderStatusBadge";
import { RemoteImageWithFallback } from "@/components/shared/RemoteImageWithFallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addShipmentAction,
  cancelOrderAction,
  refundOrderAction,
  updateOrderStatusAction,
} from "@/lib/actions/orders";
import { allowedNextStatuses } from "@/lib/orders/status-machine";
import { formatPrice } from "@/lib/utils/formatPrice";
import { useUiStore } from "@/hooks/useUiStore";
import type {
  Order,
  OrderEvent,
  OrderItem,
  OrderStatus,
  Payment,
  Shipment,
} from "@/types";

interface OrderDetailClientProps {
  order: Order;
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
  events: OrderEvent[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAddress(order: Order) {
  const address = order.shipping_address;
  const lines = [
    address.name,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.pincode}`,
    address.country,
    address.phone,
  ].filter(Boolean);

  return lines.join("\n");
}

export function OrderDetailClient({
  order,
  items,
  payments,
  shipments,
  events,
}: OrderDetailClientProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [isPending, startTransition] = useTransition();
  const [carrier, setCarrier] = useState("");
  const [awb, setAwb] = useState("");

  const nextStatuses = allowedNextStatuses(order.status);
  const canShip = nextStatuses.includes("shipped");
  const canCancel = nextStatuses.includes("cancelled");
  const canRefund =
    order.payment_status === "paid" ||
    order.payment_status === "partially_refunded";

  const runAction = (action: () => Promise<{ ok: boolean; error?: { message: string }; message?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        showToast(result.message ?? "Order updated", "success");
        router.refresh();
        return;
      }
      showToast(result.error?.message ?? "Action failed", "error");
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="v18-card space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold v18-text-heading">
              {order.order_number}
            </h2>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="v18-text-muted">Customer</dt>
              <dd>{order.email}</dd>
              {order.phone ? <dd className="text-slate-500">{order.phone}</dd> : null}
            </div>
            <div>
              <dt className="v18-text-muted">Placed</dt>
              <dd>{order.placed_at ? formatDate(order.placed_at) : "Not paid yet"}</dd>
            </div>
            <div>
              <dt className="v18-text-muted">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div>
              <dt className="v18-text-muted">Total</dt>
              <dd className="font-semibold">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="v18-card space-y-3 p-6">
          <h3 className="font-semibold v18-text-heading">Shipping address</h3>
          <pre className="whitespace-pre-wrap text-sm text-slate-700">
            {formatAddress(order)}
          </pre>
        </div>
      </div>

      <div className="v18-card overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {item.image_snapshot ? (
                      <div className="relative size-12 overflow-hidden rounded-md bg-slate-100">
                        <RemoteImageWithFallback
                          src={item.image_snapshot}
                          alt={item.name_snapshot}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : null}
                    <div>
                      <div className="font-medium">{item.name_snapshot}</div>
                      {(item.size || item.color) && (
                        <div className="text-xs text-slate-500">
                          {[item.size, item.color].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{item.sku_snapshot ?? "—"}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>{formatPrice(item.unit_price)}</TableCell>
                <TableCell>{formatPrice(item.line_total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="v18-card space-y-4 p-6">
          <h3 className="font-semibold v18-text-heading">Payments</h3>
          {payments.length ? (
            <ul className="space-y-3 text-sm">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium capitalize">{payment.status}</div>
                    <div className="text-xs text-slate-500">
                      {formatDate(payment.created_at)}
                    </div>
                  </div>
                  <div>{formatPrice(payment.amount)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No payment records yet.</p>
          )}
        </div>

        <div className="v18-card space-y-4 p-6">
          <h3 className="font-semibold v18-text-heading">Shipments</h3>
          {shipments.length ? (
            <ul className="space-y-3 text-sm">
              {shipments.map((shipment) => (
                <li key={shipment.id}>
                  <div className="font-medium">
                    {shipment.carrier ?? "Carrier"} · {shipment.awb ?? "AWB pending"}
                  </div>
                  {shipment.shipped_at ? (
                    <div className="text-xs text-slate-500">
                      Shipped {formatDate(shipment.shipped_at)}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No shipments recorded.</p>
          )}
        </div>
      </div>

      <div className="v18-card space-y-4 p-6">
        <h3 className="font-semibold v18-text-heading">Timeline</h3>
        {events.length ? (
          <ul className="space-y-3 text-sm">
            {events.map((event) => (
              <li key={event.id} className="border-l-2 border-slate-200 pl-4">
                <div className="font-medium capitalize">
                  {event.event_type.replace("_", " ")}
                  {event.from_status && event.to_status
                    ? `: ${event.from_status} → ${event.to_status}`
                    : null}
                </div>
                <div className="text-xs text-slate-500">
                  {formatDate(event.created_at)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No events recorded yet.</p>
        )}
      </div>

      <div className="v18-card space-y-6 p-6">
        <h3 className="font-semibold v18-text-heading">Actions</h3>

        {nextStatuses.filter((status) => status !== "cancelled" && status !== "shipped").length ? (
          <div className="flex flex-wrap gap-2">
            {nextStatuses
              .filter((status) => status !== "cancelled" && status !== "shipped")
              .map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    runAction(() =>
                      updateOrderStatusAction({
                        orderId: order.id,
                        status: status as OrderStatus,
                      })
                    )
                  }
                >
                  Mark {status}
                </Button>
              ))}
          </div>
        ) : null}

        {canShip ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Input
                id="carrier"
                value={carrier}
                onChange={(event) => setCarrier(event.target.value)}
                placeholder="Delhivery, Blue Dart…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awb">AWB / tracking</Label>
              <Input
                id="awb"
                value={awb}
                onChange={(event) => setAwb(event.target.value)}
                placeholder="Tracking number"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                disabled={isPending || !carrier.trim() || !awb.trim()}
                onClick={() =>
                  runAction(() =>
                    addShipmentAction({
                      orderId: order.id,
                      carrier,
                      awb,
                    })
                  )
                }
              >
                Mark shipped
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canCancel ? (
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (!confirm("Cancel this order? Paid orders will be refunded.")) {
                  return;
                }
                runAction(() => cancelOrderAction(order.id));
              }}
            >
              Cancel order
            </Button>
          ) : null}

          {canRefund ? (
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => {
                if (!confirm("Issue a full refund and restock items?")) {
                  return;
                }
                runAction(() => refundOrderAction({ orderId: order.id }));
              }}
            >
              Full refund
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
