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
    product.description?.trim() ||
    `Shop ${product.name} at Aasi. ${price}.`;

  const firstImage = getProductImagePaths(product)[0];
  const imageUrl = firstImage ? resolveImageUrl(firstImage) : undefined;

  const images = imageUrl
    ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ]
    : undefined;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
