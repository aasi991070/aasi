"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { resolveProductImageList } from "@/lib/storage/images";
import { RemoteImage } from "@/components/shared/RemoteImage";

interface ProductImageGalleryProps {
  images?: string[] | null;
  thumbnailUrl?: string | null;
  productName: string;
}

export function ProductImageGallery({
  images,
  thumbnailUrl,
  productName,
}: ProductImageGalleryProps) {
  const resolvedImages = resolveProductImageList({ images, thumbnail_url: thumbnailUrl });
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbs = resolvedImages.slice(0, 4);
  const activeImage = resolvedImages[activeIndex] ?? resolvedImages[0];

  return (
    <div className="v18-card overflow-hidden p-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-v18-stat)] bg-slate-100">
        <RemoteImage
          key={activeImage}
          src={activeImage}
          alt={`${productName} — image ${activeIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={activeIndex === 0}
        />
      </div>

      {thumbs.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {thumbs.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                activeIndex === i
                  ? "border-v18-primary"
                  : "border-v18-border hover:border-v18-muted"
              )}
            >
              <RemoteImage
                src={src}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
