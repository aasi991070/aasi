import { DEFAULT_HERO, REVALIDATE_SECONDS } from "@/constants";
import {
  FEATURED_SLIDESHOW_IMAGES,
  HERO_SUIT_SLIDES,
  type SlideshowImage,
  type SuitSlide,
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
    const publicUrl = getPublicUrl(trimmed);
    return publicUrl || null;
  }
  return trimmed;
}

/** next/image only allows configured hosts — blocked URLs render as empty panels. */
function isAllowedHeroSrc(src: string): boolean {
  if (src.startsWith("products/") || src.startsWith("hero/")) return true;
  try {
    const { hostname, protocol } = new URL(src);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "images.unsplash.com") return true;
    if (hostname.endsWith(".supabase.co")) return true;
    return false;
  } catch {
    return false;
  }
}

function toSlideshowImage(src: string, alt: string): SlideshowImage {
  return { src, alt };
}

function padTrio(
  photos: SlideshowImage[]
): [SlideshowImage, SlideshowImage, SlideshowImage] {
  const last = photos[photos.length - 1]!;
  while (photos.length < 3) {
    photos.push(last);
  }
  return [photos[0]!, photos[1]!, photos[2]!];
}

function chunkIntoSuitSlides(images: SlideshowImage[]): SuitSlide[] {
  if (images.length === 0) return [];

  const slides: SuitSlide[] = [];
  for (let i = 0; i < images.length; i += 3) {
    const chunk = images.slice(i, i + 3);
    const photos = padTrio([...chunk]);
    slides.push({
      id: `cms-${i / 3}`,
      label: `Hero look ${slides.length + 1}`,
      photos,
    });
  }
  return slides;
}

function buildHeroSlides(settings: {
  hero_image_url: string;
  hero_image_urls?: string[];
}): SuitSlide[] {
  const fromCms = (settings.hero_image_urls ?? [])
    .map((url) => resolveHeroImageSrc(url))
    .filter((src): src is string => src != null && isAllowedHeroSrc(src))
    .map((src, index) => toSlideshowImage(src, `Hero image ${index + 1}`));

  if (fromCms.length > 0) {
    return chunkIntoSuitSlides(fromCms);
  }

  // Ignore a single custom hero_image_url when it is blocked/unusable (e.g.
  // gstatic shopping thumbs) — otherwise slide 0 is an empty triptych.
  const single = resolveHeroImageSrc(settings.hero_image_url);
  const isDefaultSingle = !single || single === DEFAULT_HERO.hero_image_url;

  if (!isDefaultSingle && single && isAllowedHeroSrc(single)) {
    const photo = toSlideshowImage(single, "Hero banner");
    return [
      {
        id: "cms-single",
        label: "Hero banner",
        photos: [photo, photo, photo],
      },
      ...HERO_SUIT_SLIDES,
    ];
  }

  return HERO_SUIT_SLIDES;
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
        slides: buildHeroSlides(settings),
      }}
      featuredImages={FEATURED_SLIDESHOW_IMAGES}
    />
  );
}
