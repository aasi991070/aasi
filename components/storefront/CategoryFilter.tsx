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
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider v18-text-heading">
          Size
        </p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleArrayParam("sizes", size, activeSizes)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                activeSizes.includes(size)
                  ? "border-v18-primary bg-v18-primary text-white"
                  : "border-v18-border v18-text-muted hover:border-v18-primary"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {availableColors.length > 0 && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider v18-text-heading">
            Color
          </p>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleArrayParam("colors", color, activeColors)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs capitalize transition-colors",
                  activeColors.includes(color)
                    ? "border-v18-primary bg-v18-primary text-white"
                    : "border-v18-border v18-text-muted hover:border-v18-primary"
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider v18-text-heading">
          Price
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParams("minPrice", e.target.value || null)}
            className="w-full rounded-[var(--radius-v18-input)] border border-v18-border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParams("maxPrice", e.target.value || null)}
            className="w-full rounded-[var(--radius-v18-input)] border border-v18-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => updateParams("inStock", inStock ? null : "true")}
          className={cn(
            "rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors",
            inStock
              ? "border-v18-primary bg-v18-primary text-white"
              : "border-v18-border v18-text-muted"
          )}
        >
          In Stock Only
        </button>
      </div>

      {(activeSizes.length || activeColors.length || inStock || minPrice || maxPrice) && (
        <Link href="?" className="text-xs v18-text-muted underline hover:text-v18-heading">
          Clear all filters
        </Link>
      )}
    </div>
  );

  return (
    <>
      <aside className="v18-card hidden w-56 shrink-0 p-5 lg:block">{filterContent}</aside>

      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="v18-card rounded-full px-6 py-3 text-xs font-medium uppercase tracking-wider shadow-lg"
            >
              Filters
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] overflow-y-auto rounded-t-2xl">
            <div className="pt-6">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
