/**
 * GST rate for a garment line. Uses the product's configured rate when set;
 * otherwise applies the price-band slab (5% up to ₹999.99, 12% from ₹1000).
 *
 * TODO: confirm HSN codes and GST slabs with the accountant.
 */
export function resolveLineTaxRate(
  unitPrice: number,
  productTaxRate?: number | null
): number {
  if (productTaxRate != null && Number.isFinite(productTaxRate)) {
    return Number(productTaxRate);
  }

  return unitPrice >= 1000 ? 12 : 5;
}

export function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function lineTaxAmount(taxableAmount: number, taxRate: number): number {
  return roundMoney((taxableAmount * taxRate) / 100);
}
