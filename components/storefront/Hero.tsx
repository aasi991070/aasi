import Link from "next/link";
import { ImageSlideshow } from "@/components/storefront/ImageSlideshow";
import type { SlideshowImage } from "@/constants/heroImages";

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  images: SlideshowImage[];
}

export function Hero({
  title = "Timeless Craft, Modern Silhouette",
  subtitle = "Discover our curated collection of luxury essentials",
  ctaLabel = "Explore Collection",
  ctaHref = "/category/mens",
  images,
}: HeroProps) {
  return (
    <section className="relative left-1/2 mb-12 min-h-[90vh] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden">
      <ImageSlideshow
        images={images}
        variant="hero"
        priorityFirst
        label="Homepage hero"
        className="absolute inset-0"
      />

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/10"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-16 pt-24 lg:px-8 lg:pb-20">
        <h1 className="max-w-3xl font-display text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.05] tracking-[-0.02em] text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-xl font-sans text-base text-white/85 md:text-lg">
            {subtitle}
          </p>
        ) : null}
        <Link
          href={ctaHref}
          className="mt-8 inline-flex min-h-11 w-fit items-center border border-white px-8 font-sans text-xs uppercase tracking-[0.15em] text-white transition-colors hover:border-store-accent hover:bg-store-accent hover:text-store-white"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
