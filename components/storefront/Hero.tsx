"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
}

export function Hero({
  title = "Timeless Craft, Modern Silhouette",
  subtitle = "Discover our curated collection of luxury essentials",
  ctaLabel = "Explore Collection",
  ctaHref = "/category/mens",
  imageUrl = "https://images.unsplash.com/photo-1441984904996-e0b46a68737d?w=1920&q=80",
}: HeroProps) {
  return (
    <section className="mb-8">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold v18-text-on-gradient md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm v18-text-muted-on-gradient">{subtitle}</p>
      </div>

      <div className="v18-card overflow-hidden p-0">
        <div className="relative aspect-[21/9] min-h-[280px]">
          <Image
            src={imageUrl}
            alt="Hero"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-v18-bg-from/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <Link
              href={ctaHref}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-v18-btn)] border border-white px-8 text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-v18-primary"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
