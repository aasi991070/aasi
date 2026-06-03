import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { REVALIDATE_SECONDS } from "@/constants";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategoryBreadcrumb } from "@/components/storefront/CategoryBreadcrumb";
import { CategoryFilter } from "@/components/storefront/CategoryFilter";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllCategories,
  getCategoryBreadcrumb,
} from "@/lib/queries/categories";
import { getProductsByCategory } from "@/lib/queries/products";
import { splitDescriptionParagraphs } from "@/lib/utils/formatDescription";
import type { StorefrontFilters } from "@/types";

export const revalidate = REVALIDATE_SECONDS;

async function resolveCategoryFromSlugs(slugs: string[]) {
  const all = await getAllCategories(true);
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

async function getDescendantIds(categoryId: string, all: Awaited<ReturnType<typeof getAllCategories>>) {
  const ids = new Set<string>([categoryId]);
  const collect = (parentId: string) => {
    all.filter((c) => c.parent_id === parentId).forEach((child) => {
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
  const category = await resolveCategoryFromSlugs(slug);
  if (!category) return { title: "Category Not Found" };
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} at Aasi`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const filters = await searchParams;
  const category = await resolveCategoryFromSlugs(slug);
  if (!category) notFound();

  const allCategories = await getAllCategories(true);
  const categoryIds = await getDescendantIds(category.id, allCategories);
  const breadcrumb = await getCategoryBreadcrumb(category.id);

  const storefrontFilters: StorefrontFilters = {
    sizes: filters.sizes?.split(",").filter(Boolean),
    colors: filters.colors?.split(",").filter(Boolean),
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    inStock: filters.inStock === "true",
    search: filters.search?.trim() || undefined,
  };

  const products = await getProductsByCategory(categoryIds, storefrontFilters);

  const availableColors = Array.from(
    new Set(products.flatMap((p) => p.colors))
  ).sort();

  const descriptionParagraphs = splitDescriptionParagraphs(
    category.description
  );

  return (
    <>
      <PageHeader title={category.name} />
      {descriptionParagraphs.length > 0 && (
        <div className="mb-6 -mt-4 space-y-2">
          {descriptionParagraphs.map((para, i) => (
            <p key={i} className="text-sm v18-text-muted-on-gradient">
              {para}
            </p>
          ))}
        </div>
      )}
      <CategoryBreadcrumb items={breadcrumb} onGradient />

      <div className="mt-6 flex gap-8">
        <Suspense fallback={<Skeleton className="v18-card hidden h-96 w-56 lg:block" />}>
          <CategoryFilter availableColors={availableColors} />
        </Suspense>
        <div className="flex-1 pb-24">
          <ProductGrid products={products} />
        </div>
      </div>
    </>
  );
}
