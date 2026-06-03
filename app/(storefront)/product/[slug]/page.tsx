import { notFound } from "next/navigation";
import { REVALIDATE_SECONDS } from "@/constants";
import { ProductDetailClient } from "@/components/storefront/ProductDetailClient";
import { buildProductMetadata } from "@/lib/metadata/product";
import {
  getAllCategories,
  getCategoryBreadcrumb,
} from "@/lib/queries/categories";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import {
  getReviewSummary,
  getReviewsByProductId,
} from "@/lib/queries/reviews";
import { findLevel1Category } from "@/lib/utils/getGenderCategory";

export const revalidate = REVALIDATE_SECONDS;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  return buildProductMetadata(product);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const allCategories = await getAllCategories(true);
  const genderCategory = findLevel1Category(
    product.category_id,
    allCategories
  );

  const [breadcrumb, related, reviews, reviewSummary] = await Promise.all([
    product.category_id
      ? getCategoryBreadcrumb(product.category_id)
      : Promise.resolve([]),
    getRelatedProducts(product),
    getReviewsByProductId(product.id),
    getReviewSummary(product.id),
  ]);

  const mergedBreadcrumb = (() => {
    if (!genderCategory) return breadcrumb;
    if (breadcrumb.some((c) => c.id === genderCategory.id)) return breadcrumb;
    return [genderCategory, ...breadcrumb];
  })();

  return (
    <ProductDetailClient
      product={product}
      breadcrumb={mergedBreadcrumb}
      related={related}
      genderCategory={genderCategory}
      initialReviews={reviews}
      reviewSummary={reviewSummary}
    />
  );
}
