import { ImageSlideshow } from "@/components/storefront/ImageSlideshow";
import type { SlideshowImage } from "@/constants/heroImages";

interface FeaturedSlideshowProps {
  images: SlideshowImage[];
  title?: string;
  subtitle?: string;
}

export function FeaturedSlideshow({
  images,
  title = "Featured",
  subtitle = "Curated selections from our collection",
}: FeaturedSlideshowProps) {
  return (
    <div className="relative mb-8 aspect-[3/4] w-full overflow-hidden bg-store-surface sm:aspect-[4/5] lg:aspect-[4/3]">
      <ImageSlideshow
        images={images}
        variant="featured"
        label="Featured collection"
        className="absolute inset-0"
      />

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-0 z-[1] px-6 pb-8 pt-16 lg:px-8 lg:pb-10">
        <h2 className="font-display text-3xl font-normal text-white md:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 font-sans text-sm text-white/85">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
