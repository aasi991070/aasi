"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getFilteredProducts } from "@/lib/actions/storefront";
import {
  hasActiveStorefrontFilters,
  parseStorefrontFilters,
} from "@/lib/utils/storefrontFilters";
import type { Product } from "@/types";
import { ProductGrid } from "./ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";

interface FilteredProductGridProps {
  categoryIds: string[];
  initialProducts: Product[];
}

export function FilteredProductGrid({
  categoryIds,
  initialProducts,
}: FilteredProductGridProps) {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseStorefrontFilters(searchParams),
    [searchParams]
  );
  const filtersActive = hasActiveStorefrontFilters(filters);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filtersActive) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getFilteredProducts(categoryIds, filters)
      .then((next) => {
        if (!cancelled) setProducts(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryIds, filters, filtersActive, initialProducts]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[3/4] w-full" />
        ))}
      </div>
    );
  }

  return <ProductGrid products={products} />;
}
