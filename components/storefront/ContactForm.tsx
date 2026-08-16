"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  CONTACT_INITIAL_STATE,
  contactAction,
} from "@/lib/actions/contact";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full border-b border-store-border bg-transparent px-0 font-sans text-sm text-store-ink placeholder:text-store-ink-muted focus-visible:border-store-accent-dark focus-visible:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="store-btn min-h-11 px-8 font-sans text-xs uppercase tracking-[0.2em] disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useFormState(
    contactAction,
    CONTACT_INITIAL_STATE
  );

  if (state.ok) {
    return (
      <p
        role="status"
        className="store-hairline px-6 py-8 font-sans text-sm text-store-ink-muted"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <div>
        <label
          htmlFor="contact-name"
          className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink"
        >
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={cn(fieldClass, "mt-3")}
        />
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink"
        >
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={cn(fieldClass, "mt-3")}
        />
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          className="mt-3 w-full resize-y border-b border-store-border bg-transparent px-0 py-2 font-sans text-sm text-store-ink placeholder:text-store-ink-muted focus-visible:border-store-accent-dark focus-visible:outline-none"
        />
      </div>

      {state.message ? (
        <p role="alert" className="font-sans text-sm text-store-accent-dark">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
