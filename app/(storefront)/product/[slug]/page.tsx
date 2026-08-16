import { notFound } from "next/navigation";
import { REVALIDATE_SECONDS } from "@/constants";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductInfo } from "@/components/storefront/ProductInfo";
import { ProductPurchasePanel } from "@/components/storefront/ProductPurchasePanel";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { buildProductMetadata } from "@/lib/metadata/product";
import {
  getAllCategories,
  getCategoryBreadcrumb,
} from "@/lib/queries/categories";
import {
  getAllActiveProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/queries/products";
import {
  getReviewSummary,
  getReviewsByProductId,
} from "@/lib/queries/reviews";
import { findLevel1Category } from "@/lib/utils/getGenderCategory";

export const revalidate = REVALIDATE_SECONDS;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllActiveProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

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
    if (breadcrumb.some((category) => category.id === genderCategory.id)) {
      return breadcrumb;
    }
    return [genderCategory, ...breadcrumb];
  })();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          images={product.images}
          thumbnailUrl={product.thumbnail_url}
          productName={product.name}
        />

        <ProductInfo
          product={product}
          breadcrumb={mergedBreadcrumb}
          genderCategory={genderCategory}
          purchasePanel={<ProductPurchasePanel product={product} />}
        />
      </div>

      <ProductReviews
        productId={product.id}
        initialReviews={reviews}
        initialSummary={reviewSummary}
      />

      {related.length > 0 ? (
        <div className="mt-20 border-t border-store-border pt-12">
          <ProductGrid products={related} title="You May Also Like" />
        </div>
      ) : null}
    </div>
  );
}
