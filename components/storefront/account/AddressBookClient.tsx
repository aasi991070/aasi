"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAddressAction, saveAddressAction } from "@/lib/actions/account";
import { useUiStore } from "@/hooks/useUiStore";
import type { Address } from "@/types";

const fieldClass =
  "min-h-11 w-full border border-store-border bg-store-white px-3 font-sans text-sm text-store-ink outline-none focus:border-store-ink";

interface AddressBookClientProps {
  initialAddresses: Address[];
}

export function AddressBookClient({ initialAddresses }: AddressBookClientProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [isPending, startTransition] = useTransition();

  const submitNew = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const payload = {
        name: String(form.get("name") ?? ""),
        line1: String(form.get("line1") ?? ""),
        line2: String(form.get("line2") ?? "") || undefined,
        city: String(form.get("city") ?? ""),
        state: String(form.get("state") ?? ""),
        pincode: String(form.get("pincode") ?? ""),
        country: "IN" as const,
        phone: String(form.get("phone") ?? ""),
      };

      const result = await saveAddressAction(payload);
      showToast(result.message ?? "Saved", result.ok ? "success" : "error");
      if (result.ok) {
        event.currentTarget.reset();
        router.refresh();
      }
    });
  };

  const removeAddress = (addressId: string) => {
    startTransition(async () => {
      const result = await deleteAddressAction(addressId);
      showToast(result.message ?? "Removed", result.ok ? "info" : "error");
      if (result.ok) {
        setAddresses((current) =>
          current.filter((address) => address.id !== addressId)
        );
      }
    });
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
          Saved addresses
        </h2>
        {!addresses.length ? (
          <p className="font-sans text-sm text-store-ink-muted">
            No saved addresses yet.
          </p>
        ) : (
          addresses.map((address) => (
            <article
              key={address.id}
              className="border border-store-border p-4 font-sans text-sm text-store-ink"
            >
              <p className="font-medium">{address.name}</p>
              <p className="mt-2 text-store-ink-muted">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.pincode}
              </p>
              <button
                type="button"
                disabled={isPending}
                onClick={() => removeAddress(address.id)}
                className="mt-4 font-sans text-xs uppercase tracking-[0.15em] text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
              >
                Remove
              </button>
            </article>
          ))
        )}
      </section>

      <section>
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
          Add address
        </h2>
        <form onSubmit={submitNew} className="mt-4 space-y-4">
          {[
            ["name", "Full name"],
            ["line1", "Address line 1"],
            ["line2", "Address line 2 (optional)"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "Pincode"],
            ["phone", "Phone"],
          ].map(([name, label]) => (
            <div key={name}>
              <label
                htmlFor={`address-${name}`}
                className="block font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
              >
                {label}
              </label>
              <input
                id={`address-${name}`}
                name={name}
                required={name !== "line2"}
                className={`${fieldClass} mt-2`}
              />
            </div>
          ))}
          <input type="hidden" name="country" value="IN" />
          <button
            type="submit"
            disabled={isPending}
            className="store-btn w-full py-3 font-sans text-xs uppercase tracking-[0.1em] disabled:opacity-50"
          >
            Save address
          </button>
        </form>
      </section>
    </div>
  );
}
