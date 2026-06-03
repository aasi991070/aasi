"use client";

import Link from "next/link";
import Image from "next/image";
import { REVALIDATE_SECONDS } from "@/constants";
import { PageHeader } from "@/components/shared/PageHeader";
import { Hero } from "@/components/storefront/Hero";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ProductCard } from "@/components/storefront/ProductCard";
import { GenderToggle } from "@/components/storefront/GenderToggle";
import type { Category, Product } from "@/types";

interface HomePageClientProps {
  featured: Product[];
  newArrivals: Product[];
  categoryCards: { l1: Category; children: Category[] }[];
  hero: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    imageUrl: string;
  };
}

export function HomePageClient({
  featured,
  newArrivals,
  categoryCards,
  hero,
}: HomePageClientProps) {
  return (
    <>
      <Hero {...hero} />

      <PageHeader title="Featured" subtitle="Curated selections from our collection" />
      <ProductGrid products={featured} />

      <div className="mt-12">
        <PageHeader
          title="Shop by Category"
          subtitle="Browse by department"
          action={<GenderToggle />}
        />
        <div className="grid gap-6 md:grid-cols-2">
          {categoryCards.map(({ l1, children }) => (
            <div key={l1.id} className="v18-card overflow-hidden p-0">
              <Link
                href={`/category/${l1.slug}`}
                className="group relative block aspect-[16/9]"
              >
                {l1.image_url ? (
                  <Image
                    src={l1.image_url}
                    alt={l1.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="50vw"
                  />
                ) : (
                  <div className="size-full bg-slate-100" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-v18-heading/50 to-transparent" />
                <span className="absolute bottom-4 left-4 text-2xl font-semibold text-white">
                  {l1.name}
                </span>
              </Link>
              <div className="flex flex-wrap gap-3 p-4">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/category/${l1.slug}/${child.slug}`}
                    className="text-xs font-medium uppercase tracking-wider text-v18-primary hover:underline"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <PageHeader title="New Arrivals" subtitle="Latest additions to the store" />
        <div className="flex gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {newArrivals.map((product) => (
            <div key={product.id} className="w-64 shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
