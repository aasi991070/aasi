"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  SUBSCRIBE_INITIAL_STATE,
  subscribeAction,
} from "@/lib/actions/newsletter";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="store-btn min-h-11 px-6 font-sans text-xs uppercase tracking-[0.2em] disabled:opacity-50"
    >
      {pending ? "Subscribing…" : "Subscribe"}
    </button>
  );
}

export function FooterNewsletter() {
  const [state, formAction] = useFormState(
    subscribeAction,
    SUBSCRIBE_INITIAL_STATE
  );

  return (
    <div className="max-w-md">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
        Newsletter
      </p>
      <p className="mt-3 font-sans text-sm leading-relaxed text-store-ink-muted">
        New arrivals and private offers, delivered quietly.
      </p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="footer-newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-11 w-full border-b border-store-border bg-transparent px-0 font-sans text-sm text-store-ink placeholder:text-store-ink-muted focus-visible:border-store-accent-dark focus-visible:outline-none"
          />
        </div>

        <SubmitButton />

        {state.message ? (
          <p
            role={state.ok ? "status" : "alert"}
            className={cn(
              "font-sans text-sm",
              state.ok ? "text-store-ink-muted" : "text-store-accent-dark"
            )}
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
