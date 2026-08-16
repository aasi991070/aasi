import Link from "next/link";
import { formatPrice } from "@/lib/utils/formatPrice";

interface CheckoutPendingPageProps {
  searchParams: {
    order?: string;
    total?: string;
  };
}

export function CheckoutPendingClient({
  orderNumber,
  total,
}: {
  orderNumber: string;
  total: number;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center lg:px-8">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-accent-dark">
        Order received
      </p>
      <h1 className="mt-4 font-display text-3xl text-store-ink">
        Payment coming next
      </h1>
      <p className="mt-4 font-sans text-sm leading-relaxed text-store-ink-muted">
        Your order <span className="text-store-ink">{orderNumber}</span> has
        been created for {formatPrice(total)}. Online payment will be enabled
        in the next release.
      </p>
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="store-btn px-8 py-3 font-sans text-xs uppercase tracking-[0.1em]"
        >
          Continue shopping
        </Link>
        <Link
          href="/contact"
          className="font-sans text-xs uppercase tracking-[0.15em] text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
        >
          Need help?
        </Link>
      </div>
    </div>
  );
}

export function CheckoutPendingPage({
  searchParams,
}: CheckoutPendingPageProps) {
  const orderNumber = searchParams.order?.trim();
  const total = Number(searchParams.total);

  if (!orderNumber || !Number.isFinite(total)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center lg:px-8">
        <h1 className="font-display text-3xl text-store-ink">Order not found</h1>
        <p className="mt-4 font-sans text-sm text-store-ink-muted">
          We could not find details for this checkout hand-off.
        </p>
        <Link
          href="/cart"
          className="store-btn mt-8 inline-block px-8 py-3 font-sans text-xs uppercase tracking-[0.1em]"
        >
          Back to cart
        </Link>
      </div>
    );
  }

  return <CheckoutPendingClient orderNumber={orderNumber} total={total} />;
}
