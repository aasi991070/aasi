"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SIZES } from "@/constants";
import { cn } from "@/lib/utils/cn";

interface CategoryFilterProps {
  availableColors?: string[];
}

export function CategoryFilter({ availableColors = [] }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSizes = searchParams.get("sizes")?.split(",").filter(Boolean) ?? [];
  const activeColors = searchParams.get("colors")?.split(",").filter(Boolean) ?? [];
  const inStock = searchParams.get("inStock") === "true";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const toggleArrayParam = (key: string, value: string, current: string[]) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateParams(key, next.length ? next.join(",") : null);
  };

  const filterContent = (
    <div className="space-y-8">
      <div>
        <p className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
          Size
        </p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
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

      {availableColors.length > 0 ? (
        <div>
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
            Color
          </p>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const pressed = activeColors.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleArrayParam("colors", color, activeColors)}
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

      <div>
        <p className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
          Price
        </p>
        <div className="flex gap-2">
          <label htmlFor="filter-min-price" className="sr-only">
            Minimum price
          </label>
          <input
            id="filter-min-price"
            type="number"
            placeholder="Min"
            aria-label="Minimum price"
            value={minPrice}
            onChange={(e) => updateParams("minPrice", e.target.value || null)}
            className="h-11 w-full border border-store-border bg-transparent px-3 font-sans text-sm text-store-ink"
          />
          <label htmlFor="filter-max-price" className="sr-only">
            Maximum price
          </label>
          <input
            id="filter-max-price"
            type="number"
            placeholder="Max"
            aria-label="Maximum price"
            value={maxPrice}
            onChange={(e) => updateParams("maxPrice", e.target.value || null)}
            className="h-11 w-full border border-store-border bg-transparent px-3 font-sans text-sm text-store-ink"
          />
        </div>
      </div>

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

      {(activeSizes.length || activeColors.length || inStock || minPrice || maxPrice) ? (
        <Link
          href="?"
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
