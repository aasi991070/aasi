import { REVALIDATE_SECONDS } from "@/constants";
import { HomePageClient } from "@/components/storefront/HomePageClient";
import {
  getCategoriesByLevel,
  getChildCategories,
} from "@/lib/queries/categories";
import {
  getFeaturedProducts,
  getNewArrivals,
} from "@/lib/queries/products";
import { getSiteSettings } from "@/lib/queries/settings";
import { getPublicUrl } from "@/lib/storage/images";

export const revalidate = REVALIDATE_SECONDS;

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1441984904996-e0b46a68737d?w=1920&q=80";

function resolveHeroImageSrc(imageUrl: string | null | undefined): string {
  if (!imageUrl) return DEFAULT_HERO_IMAGE;
  if (imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("products/") || imageUrl.startsWith("hero/")) {
    return getPublicUrl(imageUrl);
  }
  return imageUrl;
}

export default async function HomePage() {
  const [featured, newArrivals, level1Categories, settings] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(12),
    getCategoriesByLevel(1, true),
    getSiteSettings(),
  ]);

  const categoryCards = await Promise.all(
    level1Categories.map(async (l1) => {
      const children = await getChildCategories(l1.id, true);
      return { l1, children: children.slice(0, 3) };
    })
  );

  return (
    <HomePageClient
      featured={featured}
      newArrivals={newArrivals}
      categoryCards={categoryCards}
      hero={{
        title: settings.hero_title,
        subtitle: settings.hero_subtitle,
        ctaLabel: settings.hero_cta_label,
        ctaHref: settings.hero_cta_href,
        imageSrc: resolveHeroImageSrc(settings.hero_image_url),
      }}
    />
  );
}
