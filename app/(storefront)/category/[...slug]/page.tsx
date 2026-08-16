import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { REVALIDATE_SECONDS } from "@/constants";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategoryBreadcrumb } from "@/components/storefront/CategoryBreadcrumb";
import { CategoryFilter } from "@/components/storefront/CategoryFilter";
import { FilteredProductGrid } from "@/components/storefront/FilteredProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllCategories,
  getAllCategorySlugPaths,
} from "@/lib/queries/categories";
import { getProductsByCategory } from "@/lib/queries/products";
import { splitDescriptionParagraphs } from "@/lib/utils/formatDescription";
import { getCategoryBreadcrumbPath } from "@/lib/utils/getGenderCategory";
import type { Category } from "@/types";

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
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const allCategories = await getAllCategories(true);
  const category = resolveCategoryFromSlugs(slug, allCategories);
  if (!category) return { title: "Category Not Found" };
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} at Aasi`,
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
  const products = await getProductsByCategory(categoryIds);

  const availableColors = Array.from(
    new Set(products.flatMap((product) => product.colors))
  ).sort();

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
          <CategoryFilter availableColors={availableColors} />
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
              initialProducts={products}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
