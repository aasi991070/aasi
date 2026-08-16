import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderTable } from "@/components/admin/OrderTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_ORDERS_PAGE_SIZE,
  getAdminOrders,
} from "@/lib/queries/orders";
import type { OrderPaymentStatus, OrderStatus } from "@/types";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const PAYMENT_STATUSES: OrderPaymentStatus[] = [
  "unpaid",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
];

function buildOrdersQuery(params: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) next.set(key, value);
  }
  const query = next.toString();
  return query ? `?${query}` : "";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    payment?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const status = ORDER_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const paymentStatus = PAYMENT_STATUSES.includes(
    params.payment as OrderPaymentStatus
  )
    ? (params.payment as OrderPaymentStatus)
    : undefined;

  const { orders, total } = await getAdminOrders({
    search: search || undefined,
    status,
    paymentStatus,
    dateFrom: params.from || undefined,
    dateTo: params.to ? `${params.to}T23:59:59.999Z` : undefined,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_ORDERS_PAGE_SIZE));
  const queryBase = {
    search: search || undefined,
    status,
    payment: paymentStatus,
    from: params.from,
    to: params.to,
  };

  return (
    <>
      <PageHeader
        surface="admin"
        as="h1"
        title="Orders"
        subtitle="Review, fulfil, and refund customer orders"
        variant="onGradient"
      />

      <form method="get" className="mb-6 grid gap-4 lg:grid-cols-5">
        <Input
          name="search"
          placeholder="Order #, email, or phone"
          defaultValue={search}
          className="bg-white lg:col-span-2"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-md border border-input bg-white px-3 text-sm"
        >
          <option value="">All fulfilment statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          name="payment"
          defaultValue={paymentStatus ?? ""}
          className="h-10 rounded-md border border-input bg-white px-3 text-sm"
        >
          <option value="">All payment statuses</option>
          {PAYMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.replace("_", " ")}
            </option>
          ))}
        </select>
        <div className="grid gap-2 sm:grid-cols-2 lg:col-span-5 lg:max-w-xl">
          <Input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="bg-white"
          />
          <Input
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="bg-white"
          />
        </div>
        <div className="lg:col-span-5">
          <Button type="submit" className="min-h-11">
            Apply filters
          </Button>
        </div>
      </form>

      {orders.length ? (
        <>
          <OrderTable orders={orders} />
          {totalPages > 1 ? (
            <nav
              aria-label="Orders pagination"
              className="mt-6 flex justify-center gap-2"
            >
              {page > 1 ? (
                <Button asChild variant="outline">
                  <Link
                    href={buildOrdersQuery({
                      ...queryBase,
                      page: String(page - 1),
                    })}
                    scroll={false}
                  >
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Previous
                </Button>
              )}
              <span className="flex items-center px-4 text-sm text-white">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Button asChild variant="outline">
                  <Link
                    href={buildOrdersQuery({
                      ...queryBase,
                      page: String(page + 1),
                    })}
                    scroll={false}
                  >
                    Next
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Next
                </Button>
              )}
            </nav>
          ) : null}
        </>
      ) : (
        <EmptyState
          surface="admin"
          title="No orders found"
          description="Try adjusting your filters or check back after the next checkout."
        />
      )}
    </>
  );
}
