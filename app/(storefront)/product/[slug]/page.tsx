import { notFound } from "next/navigation";
import { REVALIDATE_SECONDS } from "@/constants";
import {
  ProductDetailClient,
  buildProductMetadata,
} from "@/components/storefront/ProductDetailClient";
import { getCategoryBreadcrumb } from "@/lib/queries/categories";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";

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

  const [breadcrumb, related] = await Promise.all([
    product.category_id
      ? getCategoryBreadcrumb(product.category_id)
      : Promise.resolve([]),
    getRelatedProducts(product),
  ]);

  return (
    <ProductDetailClient
      product={product}
      breadcrumb={breadcrumb}
      related={related}
    />
  );
}
