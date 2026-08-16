"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckoutOrderSummary } from "@/components/storefront/checkout/CheckoutOrderSummary";
import { createOrderAction } from "@/lib/actions/checkout";
import { lookupPincode } from "@/lib/checkout/pincode";
import {
  clearCheckoutDraft,
  loadCheckoutDraft,
  saveCheckoutDraft,
} from "@/lib/checkout/storage";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/hooks/useUiStore";
import {
  createOrderSchema,
  type CreateOrderInput,
} from "@/lib/validation/checkout";
import type {
  Address,
  CartSummary,
  CheckoutStockIssue,
  Coupon,
  ShippingRate,
} from "@/types";

const fieldClass =
  "min-h-11 w-full border border-store-border bg-store-white px-3 font-sans text-sm text-store-ink outline-none focus:border-store-ink";

const labelClass =
  "block font-sans text-xs uppercase tracking-[0.15em] text-store-ink";

interface CheckoutPageClientProps {
  initialCart: CartSummary;
  shippingRates: ShippingRate[];
  productTaxRates: Record<string, number | null>;
  coupon: Pick<Coupon, "type" | "value"> | null;
  savedAddresses: Address[];
  defaultContact: {
    email: string;
    phone: string;
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 font-sans text-xs text-store-accent-dark">
      {message}
    </p>
  );
}

export function CheckoutPageClient({
  initialCart,
  shippingRates,
  productTaxRates,
  coupon,
  savedAddresses,
  defaultContact,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [isPending, startTransition] = useTransition();
  const [stockIssues, setStockIssues] = useState<CheckoutStockIssue[]>([]);
  const [pincodeStatus, setPincodeStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const defaultShippingRateId = shippingRates[0]?.id ?? "";

  const defaultValues = useMemo<CreateOrderInput>(() => {
    const draft = loadCheckoutDraft();
    return {
      contact: {
        email: draft?.contact?.email ?? defaultContact.email,
        phone: draft?.contact?.phone ?? defaultContact.phone,
      },
      shippingAddress: {
        name: draft?.shippingAddress?.name ?? "",
        line1: draft?.shippingAddress?.line1 ?? "",
        line2: draft?.shippingAddress?.line2 ?? "",
        city: draft?.shippingAddress?.city ?? "",
        state: draft?.shippingAddress?.state ?? "",
        pincode: draft?.shippingAddress?.pincode ?? "",
        country: "IN",
        phone: draft?.shippingAddress?.phone ?? defaultContact.phone,
      },
      shippingRateId: draft?.shippingRateId ?? defaultShippingRateId,
      saveAddress: draft?.saveAddress ?? false,
      selectedAddressId: draft?.selectedAddressId,
    };
  }, [defaultContact.email, defaultContact.phone, defaultShippingRateId]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues,
  });

  const shippingRateId = watch("shippingRateId");
  const pincode = watch("shippingAddress.pincode");
  const formValues = watch();

  useEffect(() => {
    saveCheckoutDraft(formValues);
  }, [formValues]);

  useEffect(() => {
    if (!/^[1-9][0-9]{5}$/.test(pincode ?? "")) {
      setPincodeStatus("idle");
      return;
    }

    let cancelled = false;
    setPincodeStatus("loading");

    void lookupPincode(pincode).then((result) => {
      if (cancelled) return;

      if (!result) {
        setPincodeStatus("error");
        return;
      }

      setValue("shippingAddress.city", result.city, { shouldValidate: true });
      setValue("shippingAddress.state", result.state, { shouldValidate: true });
      setPincodeStatus("success");
    });

    return () => {
      cancelled = true;
    };
  }, [pincode, setValue]);

  const applySavedAddress = (address: Address) => {
    setValue("selectedAddressId", address.id);
    setValue("shippingAddress.name", address.name);
    setValue("shippingAddress.line1", address.line1);
    setValue("shippingAddress.line2", address.line2 ?? "");
    setValue("shippingAddress.city", address.city);
    setValue("shippingAddress.state", address.state);
    setValue("shippingAddress.pincode", address.pincode);
    setValue("shippingAddress.phone", address.phone ?? "");
    setValue("saveAddress", false);
  };

  const onSubmit = handleSubmit((values) => {
    setStockIssues([]);
    startTransition(async () => {
      const result = await createOrderAction(values);

      if (!result.ok) {
        if (result.error.items?.length) {
          setStockIssues(result.error.items);
        }
        showToast(result.error.message, "error");
        return;
      }

      clearCheckoutDraft();
      // TODO(26): initiate payment
      router.push(
        `/checkout/pending?order=${encodeURIComponent(result.data.orderNumber)}&total=${result.data.total}`
      );
    });
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-store-ink">Checkout</h1>
          <p className="mt-2 font-sans text-sm text-store-ink-muted">
            Guest checkout — no account required.
          </p>
        </div>
        <Link
          href="/cart"
          className="font-sans text-xs uppercase tracking-[0.15em] text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
        >
          Back to cart
        </Link>
      </div>

      {stockIssues.length ? (
        <div
          role="alert"
          className="mt-8 border border-store-accent-dark/30 bg-store-accent-dark/5 px-4 py-4 font-sans text-sm text-store-ink"
        >
          <p className="font-medium">
            {stockIssues.length} item{stockIssues.length === 1 ? "" : "s"}{" "}
            changed since you opened checkout:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-store-ink-muted">
            {stockIssues.map((issue) => (
              <li key={issue.itemId}>
                {issue.productName} — {issue.reason}
              </li>
            ))}
          </ul>
          <Link
            href="/cart"
            className="mt-3 inline-block text-store-accent-dark underline-offset-4 hover:underline"
          >
            Review your cart
          </Link>
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"
        noValidate
      >
        <div className="space-y-6">
          <CheckoutOrderSummary
            initialCart={initialCart}
            shippingRates={shippingRates}
            shippingRateId={shippingRateId}
            productTaxRates={productTaxRates}
            coupon={coupon}
          />

          <Accordion
            type="multiple"
            defaultValue={["contact", "shipping", "delivery"]}
            className="border border-store-border bg-store-white"
          >
            <AccordionItem value="contact" className="border-store-border px-4">
              <AccordionTrigger className="font-sans text-sm font-medium text-store-ink hover:no-underline">
                1. Contact
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-6">
                <div>
                  <label htmlFor="checkout-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    autoComplete="email"
                    className={cn(fieldClass, "mt-2")}
                    {...register("contact.email")}
                  />
                  <FieldError message={errors.contact?.email?.message} />
                </div>
                <div>
                  <label htmlFor="checkout-phone" className={labelClass}>
                    Phone
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    className={cn(fieldClass, "mt-2")}
                    {...register("contact.phone")}
                  />
                  <FieldError message={errors.contact?.phone?.message} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping" className="border-store-border px-4">
              <AccordionTrigger className="font-sans text-sm font-medium text-store-ink hover:no-underline">
                2. Shipping address
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-6">
                {savedAddresses.length ? (
                  <div className="space-y-2">
                    <p className={labelClass}>Saved addresses</p>
                    <div className="space-y-2">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => applySavedAddress(address)}
                          className="w-full border border-store-border px-3 py-3 text-left font-sans text-sm text-store-ink hover:border-store-ink"
                        >
                          <span className="font-medium">{address.name}</span>
                          <span className="mt-1 block text-store-ink-muted">
                            {address.line1}, {address.city}, {address.state}{" "}
                            {address.pincode}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <label htmlFor="checkout-name" className={labelClass}>
                    Full name
                  </label>
                  <input
                    id="checkout-name"
                    autoComplete="name"
                    className={cn(fieldClass, "mt-2")}
                    {...register("shippingAddress.name")}
                  />
                  <FieldError message={errors.shippingAddress?.name?.message} />
                </div>

                <div>
                  <label htmlFor="checkout-line1" className={labelClass}>
                    Address line 1
                  </label>
                  <input
                    id="checkout-line1"
                    autoComplete="address-line1"
                    className={cn(fieldClass, "mt-2")}
                    {...register("shippingAddress.line1")}
                  />
                  <FieldError message={errors.shippingAddress?.line1?.message} />
                </div>

                <div>
                  <label htmlFor="checkout-line2" className={labelClass}>
                    Address line 2 (optional)
                  </label>
                  <input
                    id="checkout-line2"
                    autoComplete="address-line2"
                    className={cn(fieldClass, "mt-2")}
                    {...register("shippingAddress.line2")}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-pincode" className={labelClass}>
                      Pincode
                    </label>
                    <input
                      id="checkout-pincode"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={6}
                      className={cn(fieldClass, "mt-2")}
                      {...register("shippingAddress.pincode")}
                    />
                    <FieldError
                      message={errors.shippingAddress?.pincode?.message}
                    />
                    {pincodeStatus === "loading" ? (
                      <p className="mt-1 font-sans text-xs text-store-ink-muted">
                        Looking up city and state…
                      </p>
                    ) : null}
                    {pincodeStatus === "success" ? (
                      <p className="mt-1 font-sans text-xs text-store-ink-muted">
                        City and state filled from pincode — edit if needed.
                      </p>
                    ) : null}
                    {pincodeStatus === "error" ? (
                      <p className="mt-1 font-sans text-xs text-store-ink-muted">
                        Could not look up this pincode. Enter city and state
                        manually.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="checkout-country" className={labelClass}>
                      Country
                    </label>
                    <input
                      id="checkout-country"
                      readOnly
                      value="India"
                      className={cn(fieldClass, "mt-2 bg-store-surface")}
                    />
                    <input type="hidden" {...register("shippingAddress.country")} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-city" className={labelClass}>
                      City
                    </label>
                    <input
                      id="checkout-city"
                      autoComplete="address-level2"
                      className={cn(fieldClass, "mt-2")}
                      {...register("shippingAddress.city")}
                    />
                    <FieldError message={errors.shippingAddress?.city?.message} />
                  </div>
                  <div>
                    <label htmlFor="checkout-state" className={labelClass}>
                      State
                    </label>
                    <input
                      id="checkout-state"
                      autoComplete="address-level1"
                      className={cn(fieldClass, "mt-2")}
                      {...register("shippingAddress.state")}
                    />
                    <FieldError message={errors.shippingAddress?.state?.message} />
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-shipping-phone" className={labelClass}>
                    Delivery phone
                  </label>
                  <input
                    id="checkout-shipping-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    className={cn(fieldClass, "mt-2")}
                    {...register("shippingAddress.phone")}
                  />
                  <FieldError message={errors.shippingAddress?.phone?.message} />
                </div>

                {savedAddresses.length ? (
                  <label className="flex items-center gap-2 font-sans text-sm text-store-ink">
                    <input type="checkbox" {...register("saveAddress")} />
                    Save this address to my account
                  </label>
                ) : null}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="delivery" className="border-store-border px-4">
              <AccordionTrigger className="font-sans text-sm font-medium text-store-ink hover:no-underline">
                3. Delivery method
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6">
                {shippingRates.map((rate) => (
                  <label
                    key={rate.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border px-4 py-4 font-sans text-sm",
                      shippingRateId === rate.id
                        ? "border-store-ink bg-store-surface"
                        : "border-store-border"
                    )}
                  >
                    <input
                      type="radio"
                      value={rate.id}
                      className="mt-1"
                      {...register("shippingRateId")}
                    />
                    <span>
                      <span className="block font-medium text-store-ink">
                        {rate.label}
                      </span>
                      <span className="mt-1 block text-store-ink-muted">
                        {rate.free_above != null
                          ? `Free above ₹${rate.free_above.toFixed(0)} · otherwise ₹${rate.amount.toFixed(0)}`
                          : `₹${rate.amount.toFixed(0)}`}
                      </span>
                    </span>
                  </label>
                ))}
                <FieldError message={errors.shippingRateId?.message} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <button
            type="submit"
            disabled={isPending || !shippingRates.length}
            className="store-btn w-full py-3 font-sans text-xs uppercase tracking-[0.1em] disabled:opacity-50 lg:hidden"
          >
            {isPending ? "Placing order…" : "Place order"}
          </button>
        </div>

        <div className="hidden lg:block">
          <CheckoutOrderSummary
            initialCart={initialCart}
            shippingRates={shippingRates}
            shippingRateId={shippingRateId}
            productTaxRates={productTaxRates}
            coupon={coupon}
            mobileCollapsible={false}
          />

          <button
            type="submit"
            disabled={isPending || !shippingRates.length}
            className="store-btn mt-6 w-full py-3 font-sans text-xs uppercase tracking-[0.1em] disabled:opacity-50"
          >
            {isPending ? "Placing order…" : "Place order"}
          </button>
        </div>
      </form>
    </div>
  );
}
