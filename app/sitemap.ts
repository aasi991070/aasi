import type { MetadataRoute } from "next";
import { SITE_URL, STATIC_SITEMAP_PATHS } from "@/constants";
import { getAllCategorySlugPaths } from "@/lib/queries/categories";
import { getActiveProductsForSitemap } from "@/lib/queries/products";

const SITEMAP_CHUNK_SIZE = 5000;

export async function generateSitemaps() {
  const products = await getActiveProductsForSitemap();
  const chunkCount = Math.max(
    1,
    Math.ceil(products.length / SITEMAP_CHUNK_SIZE)
  );

  return Array.from({ length: chunkCount }, (_, index) => ({ id: index }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    id === 0 ? getAllCategorySlugPaths() : Promise.resolve([]),
    getActiveProductsForSitemap(),
  ]);

  const productSlice = products.slice(
    id * SITEMAP_CHUNK_SIZE,
    (id + 1) * SITEMAP_CHUNK_SIZE
  );

  const entries: MetadataRoute.Sitemap = [];

  if (id === 0) {
    entries.push({
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    });

    for (const { slug } of categories) {
      entries.push({
        url: `${SITE_URL}/category/${slug.join("/")}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const path of STATIC_SITEMAP_PATHS) {
      entries.push({
        url: `${SITE_URL}${path}`,
        changeFrequency: "monthly",
        priority: 0.3,
      });
    }
  }

  for (const product of productSlice) {
    entries.push({
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
