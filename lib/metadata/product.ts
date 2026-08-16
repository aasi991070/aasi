import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils/formatPrice";
import {
  getProductImagePaths,
  resolveImageUrl,
} from "@/lib/storage/images";
import type { Product } from "@/types";

export function buildProductMetadata(product: Product): Metadata {
  const price = formatPrice(product.sale_price ?? product.price);
  const description =
    product.meta_description?.trim() ||
    product.description?.trim() ||
    `Shop ${product.name} at Aasi. ${price}.`;

  const title = product.meta_title?.trim() || product.name;

  const firstImage = getProductImagePaths(product)[0];
  const imageUrl = firstImage ? resolveImageUrl(firstImage) : undefined;
  const imageAlt = product.image_alts?.[0]?.trim() || product.name;

  const images = imageUrl
    ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
