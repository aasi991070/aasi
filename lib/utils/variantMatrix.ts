import type { ProductVariant, VariantFormInput } from "@/types";

export function suggestVariantSku(
  slug: string,
  size: string,
  color: string
): string {
  const normalize = (part: string) =>
    part.trim().toUpperCase().replace(/\s+/g, "-");
  return `${normalize(slug)}-${normalize(size)}-${normalize(color)}`;
}

function variantKey(size: string, color: string): string {
  return `${size}::${color.toLowerCase()}`;
}

export function variantsFromProduct(
  sizes: string[],
  colors: string[],
  slug: string,
  existing: ProductVariant[] = []
): VariantFormInput[] {
  const byKey = new Map(
    existing.map((variant) => [
      variantKey(variant.size ?? "", variant.color ?? ""),
      variant,
    ])
  );

  const rows: VariantFormInput[] = [];

  for (const size of sizes) {
    for (const color of colors) {
      const key = variantKey(size, color);
      const match = byKey.get(key);

      rows.push({
        id: match?.id,
        size,
        color: color.toLowerCase(),
        stock_count: match?.stock_count ?? 0,
        sku: match?.sku ?? suggestVariantSku(slug, size, color),
        price_override: match?.price_override ?? null,
        is_enabled: match?.is_enabled ?? false,
      });
    }
  }

  return rows;
}

export function reconcileVariants(
  sizes: string[],
  colors: string[],
  slug: string,
  current: VariantFormInput[]
): VariantFormInput[] {
  const byKey = new Map(
    current.map((variant) => [variantKey(variant.size, variant.color), variant])
  );

  const rows: VariantFormInput[] = [];

  for (const size of sizes) {
    for (const color of colors) {
      const key = variantKey(size, color);
      const match = byKey.get(key);

      rows.push(
        match ?? {
          size,
          color: color.toLowerCase(),
          stock_count: 0,
          sku: suggestVariantSku(slug, size, color),
          price_override: null,
          is_enabled: false,
        }
      );
    }
  }

  return rows;
}

export function variantsWithStockBeingRemoved(
  previous: VariantFormInput[],
  nextSizes: string[],
  nextColors: string[]
): VariantFormInput[] {
  const nextKeys = new Set<string>();
  for (const size of nextSizes) {
    for (const color of nextColors) {
      nextKeys.add(variantKey(size, color));
    }
  }

  return previous.filter(
    (variant) =>
      !nextKeys.has(variantKey(variant.size, variant.color)) &&
      variant.stock_count > 0 &&
      variant.is_enabled
  );
}
