"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { verifyPaymentAction } from "@/lib/actions/payments";
import { formatPrice } from "@/lib/utils/formatPrice";
import { RazorpayCheckoutLauncher } from "@/components/storefront/payments/RazorpayCheckoutLauncher";
import type { Order, OrderItem } from "@/types";

interface OrderStatusClientProps {
  order: Order;
  items: OrderItem[];
}

type ViewStatus = "processing" | "confirmed" | "failed";

function resolveInitialStatus(
  order: Order,
  queryStatus: string | null
): ViewStatus {
  if (order.payment_status === "paid") {
    return "confirmed";
  }

  if (order.payment_status === "failed") {
    return "failed";
  }

  if (queryStatus === "failed") {
    return "failed";
  }

  if (queryStatus === "processing") {
    return "processing";
  }

  return "processing";
}

export function OrderStatusClient({ order, items }: OrderStatusClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStatus = searchParams.get("status");
  const paymentId = searchParams.get("payment_id") ?? undefined;
  const [viewStatus, setViewStatus] = useState<ViewStatus>(() =>
    resolveInitialStatus(order, queryStatus)
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (viewStatus !== "processing") {
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const poll = () => {
      startTransition(async () => {
        const result = await verifyPaymentAction({
          orderNumber: order.order_number,
          paymentId,
        });

        if (!result.ok) {
          return;
        }

        if (result.data.status === "confirmed") {
          setViewStatus("confirmed");
          router.replace(`/order/${encodeURIComponent(order.order_number)}`);
          return;
        }

        if (result.data.status === "failed") {
          setViewStatus("failed");
          router.replace(
            `/order/${encodeURIComponent(order.order_number)}?status=failed`
          );
        }
      });
    };

    poll();
    const interval = window.setInterval(() => {
      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(interval);
        return;
      }
      poll();
    }, 2000);

    return () => window.clearInterval(interval);
  }, [order.order_number, paymentId, router, viewStatus]);

  const handleProcessing = (nextPaymentId?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("status", "processing");
    if (nextPaymentId) {
      url.searchParams.set("payment_id", nextPaymentId);
    }
    router.replace(`${url.pathname}${url.search}`);
    setViewStatus("processing");
  };

  const handleDismissed = () => {
    setViewStatus("failed");
    router.replace(
      `/order/${encodeURIComponent(order.order_number)}?status=failed`
    );
  };

  if (viewStatus === "confirmed") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-accent-dark">
          Order confirmed
        </p>
        <h1 className="mt-4 font-display text-3xl text-store-ink">
          Thank you for your order
        </h1>
        <p className="mt-4 font-sans text-sm text-store-ink-muted">
          Order <span className="text-store-ink">{order.order_number}</span> is
          confirmed. We sent a confirmation to {order.email}.
        </p>
        <p className="mt-2 font-sans text-lg font-medium text-store-ink">
          {formatPrice(order.total)}
        </p>

        <div className="mt-10 space-y-3 text-left">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border border-store-border px-4 py-3 font-sans text-sm"
            >
              <span>
                {item.name_snapshot} × {item.qty}
              </span>
              <span>{formatPrice(item.line_total)}</span>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="store-btn mt-10 inline-block px-8 py-3 font-sans text-xs uppercase tracking-[0.1em]"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (viewStatus === "failed") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center lg:px-8">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-accent-dark">
          Payment incomplete
        </p>
        <h1 className="mt-4 font-display text-3xl text-store-ink">
          Payment was not completed
        </h1>
        <p className="mt-4 font-sans text-sm text-store-ink-muted">
          Order {order.order_number} is saved for {formatPrice(order.total)}.
          You can retry payment whenever you are ready.
        </p>

        <RazorpayCheckoutLauncher
          orderId={order.id}
          onProcessing={handleProcessing}
          onDismissed={handleDismissed}
        >
          {({ startPayment, isStarting, scriptReady }) => (
            <button
              type="button"
              disabled={isPending || isStarting || !scriptReady}
              onClick={() => void startPayment()}
              className="store-btn mt-10 px-8 py-3 font-sans text-xs uppercase tracking-[0.1em] disabled:opacity-50"
            >
              {isStarting ? "Opening payment…" : "Retry payment"}
            </button>
          )}
        </RazorpayCheckoutLauncher>

        <div className="mt-6">
          <Link
            href="/contact"
            className="font-sans text-xs uppercase tracking-[0.15em] text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
          >
            Contact support
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center lg:px-8">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-accent-dark">
        Processing payment
      </p>
      <h1 className="mt-4 font-display text-3xl text-store-ink">
        Confirming your payment
      </h1>
      <p className="mt-4 font-sans text-sm text-store-ink-muted">
        Order {order.order_number} · {formatPrice(order.total)}
      </p>
      <p className="mt-6 font-sans text-sm text-store-ink-muted" role="status">
        {isPending ? "Checking payment status…" : "This usually takes a few seconds."}
      </p>
    </div>
  );
}
