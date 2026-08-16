import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PRODUCTS_PAGE_SIZE, REVALIDATE_SECONDS } from "@/constants";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategoryBreadcrumb } from "@/components/storefront/CategoryBreadcrumb";
import { CategoryFilter } from "@/components/storefront/CategoryFilter";
import { FilteredProductGrid } from "@/components/storefront/FilteredProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllCategories,
  getAllCategorySlugPaths,
} from "@/lib/queries/categories";
import {
  getCategoryFacets,
  getProductsByCategory,
} from "@/lib/queries/products";
import { splitDescriptionParagraphs } from "@/lib/utils/formatDescription";
import { getCategoryBreadcrumbPath } from "@/lib/utils/getGenderCategory";
import {
  hasActiveStorefrontFilters,
  parseCategoryPage,
  parseStorefrontFilters,
} from "@/lib/utils/storefrontFilters";
import type { Category } from "@/types";

function toUrlSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      params.set(key, value.join(","));
    } else {
      params.set(key, value);
    }
  }
  return params;
}

export const revalidate = REVALIDATE_SECONDS;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllCategorySlugPaths();
}

function resolveCategoryFromSlugs(slugs: string[], all: Category[]) {
  let current = all.find((c) => c.slug === slugs[0] && c.level === 1);

  for (let i = 1; i < slugs.length && current; i++) {
    const next = all.find(
      (c) => c.slug === slugs[i] && c.parent_id === current!.id
    );
    if (!next) return null;
    current = next;
  }

  return current ?? null;
}

function getDescendantIds(categoryId: string, all: Category[]) {
  const ids = new Set<string>([categoryId]);
  const collect = (parentId: string) => {
    all
      .filter((c) => c.parent_id === parentId)
      .forEach((child) => {
        ids.add(child.id);
        collect(child.id);
      });
  };
  collect(categoryId);
  return Array.from(ids);
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const allCategories = await getAllCategories(true);
  const category = resolveCategoryFromSlugs(slug, allCategories);
  if (!category) return { title: "Category Not Found" };

  const canonicalPath = `/category/${slug.join("/")}`;
  const urlParams = toUrlSearchParams(resolvedSearchParams);
  const filters = parseStorefrontFilters(urlParams);
  const page = parseCategoryPage(urlParams);
  const isFiltered =
    hasActiveStorefrontFilters(filters) || page > 1;

  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} at Aasi`,
    alternates: {
      canonical: canonicalPath,
    },
    ...(isFiltered
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const allCategories = await getAllCategories(true);
  const category = resolveCategoryFromSlugs(slug, allCategories);
  if (!category) notFound();

  const categoryIds = getDescendantIds(category.id, allCategories);
  const breadcrumb = getCategoryBreadcrumbPath(category.id, allCategories);
  const categoryBasePath = `/category/${slug.join("/")}`;

  const [initialResult, facets] = await Promise.all([
    getProductsByCategory(categoryIds, {}, {
      page: 1,
      pageSize: PRODUCTS_PAGE_SIZE,
    }),
    getCategoryFacets(categoryIds),
  ]);

  const descriptionParagraphs = splitDescriptionParagraphs(
    category.description
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <CategoryBreadcrumb items={breadcrumb} />

      <PageHeader as="h1" title={category.name} />
      {descriptionParagraphs.length > 0 && (
        <div className="-mt-4 mb-6 space-y-2">
          {descriptionParagraphs.map((para, i) => (
            <p key={i} className="text-sm text-store-ink-muted">
              {para}
            </p>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-8">
        <Suspense
          fallback={<Skeleton className="hidden h-96 w-56 lg:block" />}
        >
          <CategoryFilter facets={facets} />
        </Suspense>
        <div className="flex-1 pb-24">
          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-[3/4] w-full" />
                ))}
              </div>
            }
          >
            <FilteredProductGrid
              categoryIds={categoryIds}
              categoryBasePath={categoryBasePath}
              initialResult={initialResult}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
