import { CURRENCY_CODE, CURRENCY_LOCALE } from "@/constants";

export function formatPrice(
  amount: number,
  currency = CURRENCY_CODE,
  locale = CURRENCY_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}
