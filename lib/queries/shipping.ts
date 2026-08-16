import { assertOk } from "@/lib/errors";
import { createPublicClient } from "@/lib/supabase/public";
import type { ShippingRate } from "@/types";

function mapShippingRate(row: Record<string, unknown>): ShippingRate {
  return {
    id: String(row.id),
    code: String(row.code),
    label: String(row.label),
    amount: Number(row.amount),
    free_above: row.free_above != null ? Number(row.free_above) : null,
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active),
  };
}

function isMissingShippingRates(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("shipping_rates")
  );
}

const FALLBACK_RATES: ShippingRate[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    code: "standard",
    label: "Standard delivery (5–7 business days)",
    amount: 99,
    free_above: 2999,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    code: "express",
    label: "Express delivery (2–3 business days)",
    amount: 199,
    free_above: null,
    sort_order: 2,
    is_active: true,
  },
];

export async function getShippingRates(): Promise<ShippingRate[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    if (isMissingShippingRates(error)) {
      console.warn(
        "[shipping] shipping_rates table missing — using fallback rates until migration 011 runs",
        error.message
      );
      return FALLBACK_RATES;
    }
    assertOk("shipping.list", { data, error });
  }

  return (data ?? []).map(mapShippingRate);
}

export async function getShippingRateById(id: string): Promise<ShippingRate | null> {
  const rates = await getShippingRates();
  return rates.find((rate) => rate.id === id) ?? null;
}

export { computeShippingFee } from "@/lib/checkout/totals";
