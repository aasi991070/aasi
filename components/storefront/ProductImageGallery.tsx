"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { getPublicUrl } from "@/lib/storage/images";
import { cn } from "@/lib/utils/cn";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const resolvedImages =
    images.length > 0
      ? images.map((img) =>
          img.startsWith("http") ? img : getPublicUrl(img)
        )
      : ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80"];

  const [activeIndex, setActiveIndex] = useState(0);
  const thumbs = resolvedImages.slice(0, 4);

  return (
    <div className="v18-card overflow-hidden p-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-v18-stat)] bg-slate-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative size-full"
          >
            <Image
              src={resolvedImages[activeIndex]}
              alt={`${productName} — image ${activeIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {thumbs.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {thumbs.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                activeIndex === i
                  ? "border-v18-primary"
                  : "border-v18-border hover:border-v18-muted"
              )}
            >
              <Image
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
