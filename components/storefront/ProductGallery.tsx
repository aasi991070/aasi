"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { resolveProductImageList } from "@/lib/storage/images";

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IGZpbGw9IiNmYWZhZjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiLz48L3N2Zz4=";

interface ProductGalleryProps {
  images?: string[] | null;
  thumbnailUrl?: string | null;
  productName: string;
  imageAlts?: string[] | null;
}

export function ProductGallery({
  images,
  thumbnailUrl,
  productName,
  imageAlts,
}: ProductGalleryProps) {
  const resolvedImages = resolveProductImageList({
    images,
    thumbnail_url: thumbnailUrl,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [focusedTabIndex, setFocusedTabIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollRaf = useRef<number | null>(null);

  const imageCount = resolvedImages.length;
  const safeIndex = Math.min(activeIndex, Math.max(0, imageCount - 1));

  const altForIndex = (index: number) =>
    imageAlts?.[index]?.trim() ||
    `${productName} — image ${index + 1}`;

  const goToImage = useCallback(
    (index: number) => {
      if (imageCount === 0) return;
      const next = Math.max(0, Math.min(index, imageCount - 1));
      setActiveIndex(next);
      setFocusedTabIndex(next);

      const carousel = carouselRef.current;
      if (carousel) {
        carousel.scrollTo({
          left: next * carousel.clientWidth,
          behavior: "smooth",
        });
      }
    },
    [imageCount]
  );

  const handleMainKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToImage(safeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToImage(safeIndex + 1);
    }
  };

  const handleTabListKeyDown = (event: React.KeyboardEvent) => {
    if (imageCount === 0) return;

    let nextIndex = focusedTabIndex;
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        nextIndex = (focusedTabIndex + 1) % imageCount;
        break;
      case "ArrowLeft":
        event.preventDefault();
        nextIndex = (focusedTabIndex - 1 + imageCount) % imageCount;
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        event.preventDefault();
        nextIndex = imageCount - 1;
        break;
      default:
        return;
    }

    setFocusedTabIndex(nextIndex);
    goToImage(nextIndex);
  };

  const handleCarouselScroll = () => {
    if (scrollRaf.current != null) return;

    scrollRaf.current = window.requestAnimationFrame(() => {
      scrollRaf.current = null;
      const carousel = carouselRef.current;
      if (!carousel || carousel.clientWidth === 0) return;

      const index = Math.round(carousel.scrollLeft / carousel.clientWidth);
      if (index !== activeIndex) {
        setActiveIndex(index);
        setFocusedTabIndex(index);
      }
    });
  };

  useEffect(
    () => () => {
      if (scrollRaf.current != null) {
        window.cancelAnimationFrame(scrollRaf.current);
      }
    },
    []
  );

  if (imageCount === 0) {
    return (
      <div className="aspect-[3/4] bg-store-surface" aria-hidden="true" />
    );
  }

  const activeSrc = resolvedImages[safeIndex];

  return (
    <div>
      <div className="hidden lg:block">
        <button
          type="button"
          className="relative aspect-[3/4] w-full overflow-hidden bg-store-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-store-accent-dark"
          onClick={() => setZoomOpen(true)}
          onKeyDown={handleMainKeyDown}
          aria-label={`${productName} — image ${safeIndex + 1} of ${imageCount}. Press arrow keys to change image.`}
        >
          <Image
            src={activeSrc}
            alt={altForIndex(safeIndex)}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={safeIndex === 0}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </button>

        {imageCount > 1 ? (
          <div
            role="tablist"
            aria-label="Product image thumbnails"
            className="mt-4 flex gap-3 overflow-x-auto pb-1"
            onKeyDown={handleTabListKeyDown}
          >
            {resolvedImages.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                role="tab"
                aria-selected={safeIndex === index}
                tabIndex={focusedTabIndex === index ? 0 : -1}
                onFocus={() => setFocusedTabIndex(index)}
                onClick={() => goToImage(index)}
                className={cn(
                  "relative aspect-square size-20 shrink-0 overflow-hidden border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-store-accent-dark",
                  safeIndex === index
                    ? "border-store-ink"
                    : "border-store-border hover:border-store-ink-muted"
                )}
              >
                <Image
                  src={src}
                  alt={altForIndex(index)}
                  fill
                  className="object-cover"
                  sizes="80px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="lg:hidden">
        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={handleCarouselScroll}
          aria-roledescription="carousel"
          aria-label={`${productName} images`}
        >
          {resolvedImages.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative aspect-[3/4] w-full shrink-0 snap-center bg-store-surface"
              aria-hidden={index !== safeIndex}
            >
              <Image
                src={src}
                alt={altForIndex(index)}
                fill
                className="object-cover"
                sizes="100vw"
                priority={index === 0}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </div>
          ))}
        </div>

        {imageCount > 1 ? (
          <div
            className="mt-4 flex justify-center gap-2"
            role="tablist"
            aria-label="Image indicators"
          >
            {resolvedImages.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                role="tab"
                aria-selected={safeIndex === index}
                aria-label={`Show image ${index + 1}`}
                className="inline-flex size-11 items-center justify-center"
                onClick={() => goToImage(index)}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2.5 rounded-full transition-colors",
                    safeIndex === index ? "bg-store-ink" : "bg-store-border"
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-5xl border-store-border p-2 sm:p-4">
          <DialogTitle className="sr-only">
            {productName} — enlarged image {safeIndex + 1}
          </DialogTitle>
          <div className="relative aspect-[3/4] w-full max-h-[85vh] bg-store-surface">
            <Image
              src={activeSrc}
              alt={altForIndex(safeIndex)}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
