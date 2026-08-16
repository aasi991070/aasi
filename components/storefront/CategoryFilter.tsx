"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleArrayParam("sizes", size, activeSizes)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-sans text-xs transition-colors",
                activeSizes.includes(size)
                  ? "border-store-ink bg-store-ink text-store-white"
                  : "border-store-border text-store-ink-muted hover:border-store-ink"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {availableColors.length > 0 ? (
        <div>
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
            Color
          </p>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleArrayParam("colors", color, activeColors)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-sans text-xs capitalize transition-colors",
                  activeColors.includes(color)
                    ? "border-store-ink bg-store-ink text-store-white"
                    : "border-store-border text-store-ink-muted hover:border-store-ink"
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
          Price
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParams("minPrice", e.target.value || null)}
            className="w-full border border-store-border bg-transparent px-3 py-2 font-sans text-sm text-store-ink"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParams("maxPrice", e.target.value || null)}
            className="w-full border border-store-border bg-transparent px-3 py-2 font-sans text-sm text-store-ink"
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => updateParams("inStock", inStock ? null : "true")}
          className={cn(
            "rounded-full border px-4 py-2 font-sans text-xs uppercase tracking-[0.15em] transition-colors",
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
          className="font-sans text-xs text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
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
              className="store-hairline rounded-full bg-store-white px-6 py-3 font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
            >
              Filters
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[70vh] overflow-y-auto rounded-t-2xl border-store-border bg-store-white"
          >
            <div className="pt-6">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
