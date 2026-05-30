import type { Metadata } from "next";
import type { Product } from "@/types";

export function buildProductMetadata(product: Product): Metadata {
  return {
    title: product.name,
    description: product.description ?? `${product.name} — Aasi`,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
    },
  };
}
