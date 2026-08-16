"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { linkGuestOrdersAction } from "@/lib/actions/account";
import { useUiStore } from "@/hooks/useUiStore";

const fieldClass =
  "min-h-11 w-full border border-store-border bg-store-white px-3 font-sans text-sm text-store-ink outline-none focus:border-store-ink";

export function AccountSignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useUiStore();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get("redirect") ?? "/account";

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });

      if (error) {
        throw error;
      }

      setStep("verify");
      showToast("Check your email for a sign-in code.", "success");
    } catch {
      showToast("Could not send the sign-in code. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "email",
      });

      if (error) {
        throw error;
      }

      await linkGuestOrdersAction();
      router.push(redirect);
      router.refresh();
    } catch {
      showToast("Invalid or expired code. Request a new one.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16 lg:px-8">
      <h1 className="font-display text-3xl text-store-ink">Sign in</h1>
      <p className="mt-3 font-sans text-sm text-store-ink-muted">
        We will email you a one-time code. No password required.
      </p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-10 space-y-6" noValidate>
          <div>
            <label
              htmlFor="sign-in-email"
              className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
            >
              Email
            </label>
            <input
              id="sign-in-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${fieldClass} mt-2`}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="store-btn w-full py-3 font-sans text-xs uppercase tracking-[0.1em] disabled:opacity-50"
          >
            {loading ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-10 space-y-6" noValidate>
          <p className="font-sans text-sm text-store-ink-muted">
            Enter the code sent to {email}.
          </p>
          <div>
            <label
              htmlFor="sign-in-code"
              className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
            >
              Code
            </label>
            <input
              id="sign-in-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className={`${fieldClass} mt-2`}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="store-btn w-full py-3 font-sans text-xs uppercase tracking-[0.1em] disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Continue"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="font-sans text-xs text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
