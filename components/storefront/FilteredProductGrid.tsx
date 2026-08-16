"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getFilteredProducts } from "@/lib/actions/storefront";
import {
  buildCategoryQueryString,
  parseCategoryPage,
  parseCategorySort,
  parseStorefrontFilters,
  shouldRefetchCategoryProducts,
} from "@/lib/utils/storefrontFilters";
import { useLiveRegionStore } from "@/hooks/useLiveRegionStore";
import type { CategoryProductsResult } from "@/types";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { ProductGrid } from "./ProductGrid";
import { SortSelect } from "./SortSelect";
import { Skeleton } from "@/components/ui/skeleton";

interface FilteredProductGridProps {
  categoryIds: string[];
  categoryBasePath: string;
  initialResult: CategoryProductsResult;
}

function CategoryPagination({
  basePath,
  searchParams,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  searchParams: URLSearchParams;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((candidate) => {
      if (totalPages <= 7) return true;
      if (candidate === 1 || candidate === totalPages) return true;
      return Math.abs(candidate - page) <= 1;
    });

  return (
    <nav
      aria-label="Category pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link
          href={`${basePath}${buildCategoryQueryString(searchParams, {
            page: String(page - 1),
          })}`}
          className="inline-flex min-h-11 items-center border border-store-border px-4 font-sans text-xs uppercase tracking-[0.15em] text-store-ink hover:border-store-ink"
        >
          Previous
        </Link>
      ) : null}

      {pages.map((candidate, index) => {
        const prev = pages[index - 1];
        const showEllipsis = prev != null && candidate - prev > 1;

        return (
          <span key={candidate} className="flex items-center gap-2">
            {showEllipsis ? (
              <span className="px-2 text-store-ink-muted">…</span>
            ) : null}
            <Link
              href={`${basePath}${buildCategoryQueryString(searchParams, {
                page: String(candidate),
              })}`}
              aria-current={candidate === page ? "page" : undefined}
              className={
                candidate === page
                  ? "inline-flex min-h-11 min-w-11 items-center justify-center border border-store-ink bg-store-ink font-sans text-xs text-store-white"
                  : "inline-flex min-h-11 min-w-11 items-center justify-center border border-store-border font-sans text-xs text-store-ink hover:border-store-ink"
              }
            >
              {candidate}
            </Link>
          </span>
        );
      })}

      {page < totalPages ? (
        <Link
          href={`${basePath}${buildCategoryQueryString(searchParams, {
            page: String(page + 1),
          })}`}
          className="inline-flex min-h-11 items-center border border-store-border px-4 font-sans text-xs uppercase tracking-[0.15em] text-store-ink hover:border-store-ink"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}

export function FilteredProductGrid({
  categoryIds,
  categoryBasePath,
  initialResult,
}: FilteredProductGridProps) {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseStorefrontFilters(searchParams),
    [searchParams]
  );
  const page = parseCategoryPage(searchParams);
  const sort = parseCategorySort(searchParams);
  const needsFetch = shouldRefetchCategoryProducts(searchParams);
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const announce = useLiveRegionStore((state) => state.announce);
  const lastAnnouncedTotal = useRef<number | null>(null);

  useEffect(() => {
    if (!needsFetch) {
      setResult(initialResult);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getFilteredProducts(categoryIds, filters, { page, sort })
      .then((next) => {
        if (!cancelled) setResult(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryIds, filters, initialResult, needsFetch, page, sort]);

  const { products, total, pageSize } = result;

  useEffect(() => {
    if (loading || lastAnnouncedTotal.current === total) return;
    lastAnnouncedTotal.current = total;
    announce(
      total === 1 ? "1 product matches" : `${total} products match`
    );
  }, [announce, loading, total]);

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[3/4] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <SortSelect />
      <ActiveFilterChips />

      {total > 0 ? (
        <p className="mb-6 font-sans text-sm text-store-ink-muted">
          Showing {start}–{end} of {total}
        </p>
      ) : null}

      <ProductGrid products={products} priority={4} />

      <CategoryPagination
        basePath={categoryBasePath}
        searchParams={searchParams}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
}
