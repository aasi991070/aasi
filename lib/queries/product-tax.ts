import { createPublicClient } from "@/lib/supabase/public";

export async function getProductTaxRates(
  productIds: string[]
): Promise<Record<string, number | null>> {
  if (!productIds.length) {
    return {};
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, tax_rate")
    .in("id", productIds);

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("tax_rate")) {
      return Object.fromEntries(productIds.map((id) => [id, null]));
    }
    return Object.fromEntries(productIds.map((id) => [id, null]));
  }

  const rates: Record<string, number | null> = Object.fromEntries(
    productIds.map((id) => [id, null])
  );

  for (const row of data ?? []) {
    rates[String(row.id)] =
      row.tax_rate != null ? Number(row.tax_rate) : null;
  }

  return rates;
}
