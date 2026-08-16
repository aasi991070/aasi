"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { lookupOrderAction } from "@/lib/actions/account";

const fieldClass =
  "min-h-11 w-full border border-store-border bg-store-white px-3 font-sans text-sm text-store-ink outline-none focus:border-store-ink";

export function OrderLookupClient() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mx-auto max-w-md space-y-6 px-6 py-16 lg:px-8"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const form = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await lookupOrderAction({
            orderNumber: String(form.get("orderNumber") ?? ""),
            email: String(form.get("email") ?? ""),
          });

          if (result.ok) {
            router.push(`/order/${encodeURIComponent(result.orderNumber)}`);
            return;
          }

          setMessage(result.message);
        });
      }}
      noValidate
    >
      <div>
        <h1 className="font-display text-3xl text-store-ink">Track an order</h1>
        <p className="mt-3 font-sans text-sm text-store-ink-muted">
          Enter the order number and the email used at checkout.
        </p>
      </div>

      <div>
        <label
          htmlFor="lookup-order-number"
          className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
        >
          Order number
        </label>
        <input
          id="lookup-order-number"
          name="orderNumber"
          required
          className={`${fieldClass} mt-2`}
        />
      </div>

      <div>
        <label
          htmlFor="lookup-email"
          className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
        >
          Email
        </label>
        <input
          id="lookup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={`${fieldClass} mt-2`}
        />
      </div>

      {message ? (
        <p role="alert" className="font-sans text-sm text-store-accent-dark">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="store-btn w-full py-3 font-sans text-xs uppercase tracking-[0.1em] disabled:opacity-50"
      >
        {isPending ? "Looking up…" : "Find order"}
      </button>
    </form>
  );
}
