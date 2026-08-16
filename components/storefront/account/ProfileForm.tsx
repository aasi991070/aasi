"use client";

import { useTransition } from "react";
import { updateProfileAction } from "@/lib/actions/account";
import { useUiStore } from "@/hooks/useUiStore";
import type { CustomerProfile } from "@/lib/auth/customer";

const fieldClass =
  "min-h-11 w-full border border-store-border bg-store-white px-3 font-sans text-sm text-store-ink outline-none focus:border-store-ink";

interface ProfileFormProps {
  profile: CustomerProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { showToast } = useUiStore();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="max-w-xl space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await updateProfileAction({
            fullName: String(form.get("fullName") ?? ""),
            phone: String(form.get("phone") ?? ""),
            marketingOptIn: form.get("marketingOptIn") === "on",
          });

          showToast(
            result.ok ? result.message ?? "Saved" : result.message,
            result.ok ? "success" : "error"
          );
        });
      }}
    >
      <div>
        <label
          htmlFor="profile-name"
          className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
        >
          Name
        </label>
        <input
          id="profile-name"
          name="fullName"
          defaultValue={profile.fullName}
          required
          className={`${fieldClass} mt-2`}
        />
      </div>

      <div>
        <label
          htmlFor="profile-email"
          className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
        >
          Email
        </label>
        <input
          id="profile-email"
          value={profile.email}
          readOnly
          className={`${fieldClass} mt-2 bg-store-surface`}
        />
      </div>

      <div>
        <label
          htmlFor="profile-phone"
          className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
        >
          Phone
        </label>
        <input
          id="profile-phone"
          name="phone"
          defaultValue={profile.phone}
          inputMode="numeric"
          className={`${fieldClass} mt-2`}
        />
      </div>

      <label className="flex items-center gap-2 font-sans text-sm text-store-ink">
        <input
          type="checkbox"
          name="marketingOptIn"
          defaultChecked={profile.marketingOptIn}
        />
        Email me about new collections and offers
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="store-btn px-8 py-3 font-sans text-xs uppercase tracking-[0.1em] disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
