"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  buildCategoryQueryString,
  buildClearFiltersQueryString,
  parseStorefrontFilters,
} from "@/lib/utils/storefrontFilters";
import { formatPrice } from "@/lib/utils/formatPrice";

function removeFromList(current: string[], value: string): string | null {
  const next = current.filter((item) => item !== value);
  return next.length ? next.join(",") : null;
}

export function ActiveFilterChips() {
  const searchParams = useSearchParams();
  const filters = parseStorefrontFilters(searchParams);

  const chips: { id: string; label: string; href: string }[] = [];

  for (const size of filters.sizes ?? []) {
    chips.push({
      id: `size-${size}`,
      label: `Size: ${size}`,
      href: buildCategoryQueryString(searchParams, {
        sizes: removeFromList(filters.sizes ?? [], size),
        page: null,
      }),
    });
  }

  for (const color of filters.colors ?? []) {
    chips.push({
      id: `color-${color}`,
      label: `Color: ${color}`,
      href: buildCategoryQueryString(searchParams, {
        colors: removeFromList(filters.colors ?? [], color),
        page: null,
      }),
    });
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    const minLabel =
      filters.minPrice != null ? formatPrice(filters.minPrice) : "Any";
    const maxLabel =
      filters.maxPrice != null ? formatPrice(filters.maxPrice) : "Any";
    chips.push({
      id: "price",
      label: `Price: ${minLabel} – ${maxLabel}`,
      href: buildCategoryQueryString(searchParams, {
        minPrice: null,
        maxPrice: null,
        page: null,
      }),
    });
  }

  if (filters.inStock) {
    chips.push({
      id: "in-stock",
      label: "In stock only",
      href: buildCategoryQueryString(searchParams, {
        inStock: null,
        page: null,
      }),
    });
  }

  if (!chips.length) return null;

  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-2"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <Link
          key={chip.id}
          href={chip.href}
          scroll={false}
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-store-border bg-store-white px-3 font-sans text-xs text-store-ink hover:border-store-ink"
        >
          <span>{chip.label}</span>
          <span aria-hidden="true">×</span>
          <span className="sr-only">Remove filter</span>
        </Link>
      ))}
      <Link
        href={buildClearFiltersQueryString(searchParams)}
        scroll={false}
        className="inline-flex min-h-9 items-center font-sans text-xs text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
