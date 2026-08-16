import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/shared/PageHeader";
import { Hero } from "@/components/storefront/Hero";
import { FeaturedSlideshow } from "@/components/storefront/FeaturedSlideshow";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ProductCard } from "@/components/storefront/ProductCard";
import { GenderToggle } from "@/components/storefront/GenderToggle";
import type { SlideshowImage, SuitSlide } from "@/constants/heroImages";
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
    slides: SuitSlide[];
  };
  featuredImages: SlideshowImage[];
}

export function HomePageClient({
  featured,
  newArrivals,
  categoryCards,
  hero,
  featuredImages,
}: HomePageClientProps) {
  return (
    <>
      <Hero {...hero} />

      <div className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
        <FeaturedSlideshow images={featuredImages} />
        <ProductGrid products={featured} />

        <div className="mt-12">
          <PageHeader
            title="Shop by Category"
            subtitle="Browse by department"
            action={<GenderToggle />}
          />
          <div className="grid gap-6 md:grid-cols-2">
            {categoryCards.map(({ l1, children }) => (
              <div
                key={l1.id}
                className="store-hairline overflow-hidden bg-store-white"
              >
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
                    <div className="size-full bg-store-surface" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-4 left-4 font-display text-2xl font-normal text-white">
                    {l1.name}
                  </span>
                </Link>
                <div className="flex flex-wrap gap-3 border-t border-store-border p-4">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/category/${l1.slug}/${child.slug}`}
                      className="font-sans text-xs uppercase tracking-[0.15em] text-store-ink-muted transition-colors hover:text-store-accent-dark"
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
      </div>
    </>
  );
}
