"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SlideshowImage, SuitSlide } from "@/constants/heroImages";

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IGZpbGw9IiNmYWZhZjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiLz48L3N2Zz4=";

const AUTO_ADVANCE_MS = 5000;

type ImageSlideshowProps = {
  variant: "hero" | "featured";
  priorityFirst?: boolean;
  className?: string;
  label?: string;
} & (
  { slides: SuitSlide[]; images?: never } | { images: SlideshowImage[]; slides?: never }
);

export function ImageSlideshow(props: ImageSlideshowProps) {
  const {
    variant,
    priorityFirst = false,
    className,
    label = "Image slideshow",
  } = props;

  const isHeroTriptych = variant === "hero" && Boolean(props.slides);
  const slides = props.slides ?? [];
  const images = props.images ?? [];
  const count = isHeroTriptych ? slides.length : images.length;

  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (reduceMotion || paused || count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused, count]);

  if (count === 0) {
    return (
      <div
        className={cn("relative size-full bg-store-surface", className)}
        aria-hidden="true"
      />
    );
  }

  const liveLabel = isHeroTriptych
    ? (slides[safeIndex]?.label ?? "")
    : (images[safeIndex]?.alt ?? "");

  const heroPanelSizes = "(max-width: 768px) 33vw, 33vw";
  const featuredSizes = "(max-width: 1280px) 100vw, 1280px";

  return (
    <div
      className={cn("relative size-full overflow-hidden", className)}
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(safeIndex - 1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(safeIndex + 1);
        }
      }}
      tabIndex={0}
    >
      <span id={labelId} className="sr-only">
        {label}
      </span>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Slide ${safeIndex + 1} of ${count}: ${liveLabel}`}
      </div>

      {isHeroTriptych ? (
        <div
          className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.id}
              className="grid h-full w-full shrink-0 grid-cols-3 gap-px bg-store-ink"
              aria-hidden={slideIndex !== safeIndex}
            >
              {slide.photos.map((photo, photoIndex) => (
                <div
                  key={`${slide.id}-${photoIndex}`}
                  className="relative h-full min-h-0"
                >
                  <Image
                    src={photo.src}
                    alt={slideIndex === safeIndex ? photo.alt : ""}
                    fill
                    priority={priorityFirst && slideIndex === 0 && photoIndex === 0}
                    className="object-cover object-top"
                    sizes={heroPanelSizes}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        images.map((image, i) => {
          const isActive = i === safeIndex;
          return (
            <div
              key={`${image.src}-${i}`}
              className={cn(
                "absolute inset-0 bg-store-ink transition-opacity duration-700 ease-out motion-reduce:transition-none",
                isActive ? "opacity-100" : "opacity-0"
              )}
              aria-hidden={!isActive}
            >
              <Image
                src={image.src}
                alt={isActive ? image.alt : ""}
                fill
                priority={priorityFirst && i === 0}
                className="object-cover object-top"
                sizes={featuredSizes}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </div>
          );
        })
      )}

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(safeIndex - 1)}
            className={cn(
              "absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center border border-white/40 bg-black/25 text-white transition-colors hover:border-store-accent hover:bg-store-accent hover:text-store-white",
              variant === "featured" && "left-2 size-9"
            )}
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(safeIndex + 1)}
            className={cn(
              "absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center border border-white/40 bg-black/25 text-white transition-colors hover:border-store-accent hover:bg-store-accent hover:text-store-white",
              variant === "featured" && "right-2 size-9"
            )}
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <div
            className={cn(
              "absolute z-10 flex gap-2",
              variant === "hero"
                ? "bottom-28 left-1/2 -translate-x-1/2 lg:bottom-32"
                : "bottom-20 left-1/2 -translate-x-1/2 sm:bottom-24"
            )}
            role="tablist"
            aria-label="Slide selectors"
          >
            {Array.from({ length: count }, (_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  i === safeIndex ? "bg-store-accent" : "bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
