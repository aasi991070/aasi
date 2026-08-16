"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SIZES } from "@/constants";
import {
  buildClearFiltersQueryString,
  buildCategoryQueryString,
} from "@/lib/utils/storefrontFilters";
import { cn } from "@/lib/utils/cn";
import type { CategoryFacets } from "@/types";

interface CategoryFilterProps {
  facets: CategoryFacets;
}

function sortFacetSizes(sizes: string[]): string[] {
  const order = new Map(SIZES.map((size, index) => [size, index]));
  return [...sizes].sort(
    (left, right) =>
      (order.get(left as (typeof SIZES)[number]) ?? 99) -
      (order.get(right as (typeof SIZES)[number]) ?? 99)
  );
}

function PriceRangeControl({
  boundsMin,
  boundsMax,
  valueMin,
  valueMax,
  onValuesChange,
}: {
  boundsMin: number;
  boundsMax: number;
  valueMin: number;
  valueMax: number;
  onValuesChange: (min: number, max: number) => void;
}) {
  const rangeMin = Math.floor(boundsMin);
  const rangeMax = Math.ceil(boundsMax);
  const percentMin = ((valueMin - rangeMin) / (rangeMax - rangeMin)) * 100;
  const percentMax = ((valueMax - rangeMin) / (rangeMax - rangeMin)) * 100;

  return (
    <div className="space-y-4">
      <div className="relative h-8 pt-3">
        <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-store-border" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-store-ink"
          style={{
            left: `${percentMin}%`,
            right: `${100 - percentMax}%`,
          }}
        />
        <input
          type="range"
          min={rangeMin}
          max={rangeMax}
          value={valueMin}
          aria-label="Minimum price"
          onChange={(event) => {
            const nextMin = Number(event.target.value);
            onValuesChange(Math.min(nextMin, valueMax), valueMax);
          }}
          className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-store-ink [&::-moz-range-thumb]:bg-store-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-store-ink [&::-webkit-slider-thumb]:bg-store-white"
        />
        <input
          type="range"
          min={rangeMin}
          max={rangeMax}
          value={valueMax}
          aria-label="Maximum price"
          onChange={(event) => {
            const nextMax = Number(event.target.value);
            onValuesChange(valueMin, Math.max(nextMax, valueMin));
          }}
          className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-store-ink [&::-moz-range-thumb]:bg-store-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-store-ink [&::-webkit-slider-thumb]:bg-store-white"
        />
      </div>
      <div className="flex gap-2">
        <label htmlFor="filter-min-price" className="sr-only">
          Minimum price
        </label>
        <input
          id="filter-min-price"
          type="number"
          min={rangeMin}
          max={rangeMax}
          placeholder="Min"
          aria-label="Minimum price"
          value={valueMin}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            if (!Number.isFinite(parsed)) return;
            onValuesChange(
              Math.max(rangeMin, Math.min(parsed, valueMax)),
              valueMax
            );
          }}
          className="h-11 w-full border border-store-border bg-transparent px-3 font-sans text-sm text-store-ink"
        />
        <label htmlFor="filter-max-price" className="sr-only">
          Maximum price
        </label>
        <input
          id="filter-max-price"
          type="number"
          min={rangeMin}
          max={rangeMax}
          placeholder="Max"
          aria-label="Maximum price"
          value={valueMax}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            if (!Number.isFinite(parsed)) return;
            onValuesChange(
              valueMin,
              Math.min(rangeMax, Math.max(parsed, valueMin))
            );
          }}
          className="h-11 w-full border border-store-border bg-transparent px-3 font-sans text-sm text-store-ink"
        />
      </div>
    </div>
  );
}

export function CategoryFilter({ facets }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSizes =
    searchParams.get("sizes")?.split(",").filter(Boolean) ?? [];
  const activeColors =
    searchParams.get("colors")?.split(",").filter(Boolean) ?? [];
  const inStock = searchParams.get("inStock") === "true";
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");

  const boundsMin = facets.minPrice ?? 0;
  const boundsMax = facets.maxPrice ?? 0;
  const hasPriceRange =
    facets.minPrice != null &&
    facets.maxPrice != null &&
    facets.minPrice < facets.maxPrice;

  const urlMin = minPriceParam ? Number(minPriceParam) : boundsMin;
  const urlMax = maxPriceParam ? Number(maxPriceParam) : boundsMax;

  const [localMin, setLocalMin] = useState(urlMin);
  const [localMax, setLocalMax] = useState(urlMax);

  useEffect(() => {
    setLocalMin(minPriceParam ? Number(minPriceParam) : boundsMin);
    setLocalMax(maxPriceParam ? Number(maxPriceParam) : boundsMax);
  }, [minPriceParam, maxPriceParam, boundsMin, boundsMax]);

  const sortedSizes = useMemo(
    () => sortFacetSizes(facets.sizes),
    [facets.sizes]
  );

  const updateParams = (key: string, value: string | null) => {
    router.push(
      buildCategoryQueryString(searchParams, { [key]: value, page: null }),
      { scroll: false }
    );
  };

  const toggleArrayParam = (key: string, value: string, current: string[]) => {
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    updateParams(key, next.length ? next.join(",") : null);
  };

  const applyPriceToUrl = useCallback(
    (min: number, max: number) => {
      const nextMin =
        hasPriceRange && min > boundsMin ? String(min) : null;
      const nextMax =
        hasPriceRange && max < boundsMax ? String(max) : null;

      router.push(
        buildCategoryQueryString(searchParams, {
          minPrice: nextMin,
          maxPrice: nextMax,
          page: null,
        }),
        { scroll: false }
      );
    },
    [boundsMax, boundsMin, hasPriceRange, router, searchParams]
  );

  const schedulePriceUpdate = useCallback(
    (min: number, max: number) => {
      setLocalMin(min);
      setLocalMax(max);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => applyPriceToUrl(min, max), 300);
    },
    [applyPriceToUrl]
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const hasActiveFilters = Boolean(
    activeSizes.length ||
      activeColors.length ||
      inStock ||
      minPriceParam ||
      maxPriceParam
  );

  const filterContent = (
    <div className="space-y-8">
      {sortedSizes.length > 0 ? (
        <div>
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedSizes.map((size) => {
              const pressed = activeSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleArrayParam("sizes", size, activeSizes)}
                  className={cn(
                    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 font-sans text-xs transition-colors",
                    pressed
                      ? "border-store-ink bg-store-ink text-store-white"
                      : "border-store-border text-store-ink-muted hover:border-store-ink"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {facets.colors.length > 0 ? (
        <div>
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
            Color
          </p>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((color) => {
              const pressed = activeColors.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() =>
                    toggleArrayParam("colors", color, activeColors)
                  }
                  className={cn(
                    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 font-sans text-xs capitalize transition-colors",
                    pressed
                      ? "border-store-ink bg-store-ink text-store-white"
                      : "border-store-border text-store-ink-muted hover:border-store-ink"
                  )}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasPriceRange ? (
        <div>
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
            Price
          </p>
          <PriceRangeControl
            boundsMin={boundsMin}
            boundsMax={boundsMax}
            valueMin={localMin}
            valueMax={localMax}
            onValuesChange={schedulePriceUpdate}
          />
        </div>
      ) : null}

      <div>
        <button
          type="button"
          aria-pressed={inStock}
          onClick={() => updateParams("inStock", inStock ? null : "true")}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full border px-4 font-sans text-xs uppercase tracking-[0.15em] transition-colors",
            inStock
              ? "border-store-ink bg-store-ink text-store-white"
              : "border-store-border text-store-ink-muted"
          )}
        >
          In Stock Only
        </button>
      </div>

      {hasActiveFilters ? (
        <Link
          href={buildClearFiltersQueryString(searchParams)}
          scroll={false}
          className="inline-flex min-h-11 items-center font-sans text-xs text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
        >
          Clear all filters
        </Link>
      ) : null}
    </div>
  );

  return (
    <>
      <aside className="store-hairline hidden w-56 shrink-0 bg-store-white p-5 lg:block">
        {filterContent}
      </aside>

      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="store-hairline inline-flex min-h-11 items-center rounded-full bg-store-white px-6 font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
            >
              Filters
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[70vh] overflow-y-auto rounded-t-2xl border-store-border bg-store-white"
          >
            <SheetTitle className="sr-only">Filters</SheetTitle>
            <div className="pt-6">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
