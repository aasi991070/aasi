"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  buildCategoryQueryString,
  parseCategorySort,
} from "@/lib/utils/storefrontFilters";
import type { CategorySort } from "@/types";

const SORT_OPTIONS: { value: CategorySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A–Z" },
];

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = parseCategorySort(searchParams);

  return (
    <div className="mb-4 flex justify-end">
      <label
        htmlFor="category-sort"
        className="flex items-center gap-2 font-sans text-sm text-store-ink-muted"
      >
        <span>Sort by</span>
        <select
          id="category-sort"
          value={sort}
          onChange={(event) => {
            router.push(
              buildCategoryQueryString(searchParams, {
                sort: event.target.value,
                page: null,
              }),
              { scroll: false }
            );
          }}
          className="h-11 border border-store-border bg-store-white px-3 font-sans text-sm text-store-ink"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
