"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SlideshowImage } from "@/constants/heroImages";

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IGZpbGw9IiNmYWZhZjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiLz48L3N2Zz4=";

const AUTO_ADVANCE_MS = 5000;

interface ImageSlideshowProps {
  images: SlideshowImage[];
  variant: "hero" | "featured";
  priorityFirst?: boolean;
  className?: string;
  label?: string;
}

export function ImageSlideshow({
  images,
  variant,
  priorityFirst = false,
  className,
  label = "Image slideshow",
}: ImageSlideshowProps) {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const count = images.length;
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

  const sizes = variant === "hero" ? "100vw" : "(max-width: 1280px) 100vw, 1280px";

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
        {`Slide ${safeIndex + 1} of ${count}: ${images[safeIndex]?.alt ?? ""}`}
      </div>

      {images.map((image, i) => {
        const isActive = i === safeIndex;
        return (
          <div
            key={`${image.src}-${i}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none",
              isActive ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!isActive}
          >
            <Image
              src={image.src}
              alt={isActive ? image.alt : ""}
              fill
              priority={priorityFirst && i === 0}
              className={cn(
                "object-cover",
                variant === "featured" ? "object-top" : "object-center"
              )}
              sizes={sizes}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </div>
        );
      })}

      {count > 1 && !reduceMotion ? (
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
            {images.map((_, i) => (
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
