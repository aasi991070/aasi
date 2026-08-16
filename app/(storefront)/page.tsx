import { DEFAULT_HERO, REVALIDATE_SECONDS } from "@/constants";
import {
  FEATURED_SLIDESHOW_IMAGES,
  HERO_SLIDESHOW_IMAGES,
  type SlideshowImage,
} from "@/constants/heroImages";
import { HomePageClient } from "@/components/storefront/HomePageClient";
import { getHomeCategoryCards } from "@/lib/queries/categories";
import { getFeaturedProducts, getNewArrivals } from "@/lib/queries/products";
import { getSiteSettings } from "@/lib/queries/settings";
import { getPublicUrl } from "@/lib/storage/images";

export const revalidate = REVALIDATE_SECONDS;

function resolveHeroImageSrc(imageUrl: string | null | undefined): string | null {
  if (!imageUrl?.trim()) return null;
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("products/") || trimmed.startsWith("hero/")) {
    return getPublicUrl(trimmed);
  }
  return trimmed;
}

function buildHeroImages(settings: {
  hero_image_url: string;
  hero_image_urls?: string[];
}): SlideshowImage[] {
  const fromCms = (settings.hero_image_urls ?? [])
    .map((url) => resolveHeroImageSrc(url))
    .filter((src): src is string => Boolean(src))
    .map((src, index) => ({
      src,
      alt: `Hero image ${index + 1}`,
    }));

  if (fromCms.length > 0) return fromCms;

  const single = resolveHeroImageSrc(settings.hero_image_url);
  const isDefaultSingle = !single || single === DEFAULT_HERO.hero_image_url;

  if (!isDefaultSingle) {
    return [{ src: single, alt: "Hero banner" }, ...HERO_SLIDESHOW_IMAGES];
  }

  return HERO_SLIDESHOW_IMAGES;
}

export default async function HomePage() {
  const [featured, newArrivals, categoryCards, settings] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(12),
    getHomeCategoryCards(),
    getSiteSettings(),
  ]);

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
        images: buildHeroImages(settings),
      }}
      featuredImages={FEATURED_SLIDESHOW_IMAGES}
    />
  );
}
