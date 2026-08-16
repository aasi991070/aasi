import Link from "next/link";
import { formatPrice } from "@/lib/utils/formatPrice";
import { getCustomerOrders } from "@/lib/queries/orders";

interface AccountOrdersPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function AccountOrdersPage({
  searchParams,
}: AccountOrdersPageProps) {
  const page = Number(searchParams.page ?? "1");
  const { orders, total, pageSize, page: currentPage } = await getCustomerOrders(
    Number.isFinite(page) ? page : 1
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="font-display text-3xl text-store-ink">Orders</h1>

      {!orders.length ? (
        <p className="mt-6 font-sans text-sm text-store-ink-muted">
          You have no orders yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${encodeURIComponent(order.order_number)}`}
                className="flex flex-col gap-2 border border-store-border p-4 font-sans text-sm text-store-ink transition-colors hover:border-store-ink sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="font-medium">{order.order_number}</span>
                  <span className="mt-1 block text-store-ink-muted">
                    {new Date(order.created_at).toLocaleDateString("en-IN")} ·{" "}
                    {order.status}
                  </span>
                </span>
                <span>{formatPrice(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex gap-4 font-sans text-xs uppercase tracking-[0.15em]">
          {currentPage > 1 ? (
            <Link href={`/account/orders?page=${currentPage - 1}`}>Previous</Link>
          ) : null}
          {currentPage < totalPages ? (
            <Link href={`/account/orders?page=${currentPage + 1}`}>Next</Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
