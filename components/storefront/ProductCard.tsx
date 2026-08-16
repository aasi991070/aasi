import Link from "next/link";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { resolveImageUrl, getProductImagePaths } from "@/lib/storage/images";
import { formatPrice } from "@/lib/utils/formatPrice";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const imagePath = getProductImagePaths(product)[0];
  const imageUrl = resolveImageUrl(imagePath);

  const hasSale =
    product.sale_price != null && product.sale_price < product.price;
  const soldOut = !product.in_stock;

  return (
    <article
      className={cn(
        "group border border-transparent bg-store-white transition-[border-color,transform] duration-300",
        "hover:border-store-border",
        "motion-reduce:transition-none"
      )}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-store-surface">
          {(hasSale || soldOut) && (
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
              {soldOut ? (
                <span className="bg-store-ink px-2 py-1 font-sans text-[0.625rem] uppercase tracking-[0.15em] text-store-white">
                  Sold out
                </span>
              ) : hasSale ? (
                <span className="border border-store-accent bg-store-white px-2 py-1 font-sans text-[0.625rem] uppercase tracking-[0.15em] text-store-accent-dark">
                  Sale
                </span>
              ) : null}
            </div>
          )}

          <RemoteImage
            src={imageUrl}
            alt={product.name}
            fill
            priority={priority}
            className={cn(
              "object-cover transition-transform duration-[400ms] ease-out",
              "group-hover:scale-[1.03]",
              "motion-reduce:transform-none motion-reduce:transition-none"
            )}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>

        <div className="px-4 pb-3 pt-4">
          <h3 className="font-sans text-sm font-normal text-store-ink">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            {hasSale ? (
              <>
                <span className="font-sans text-sm font-medium text-store-accent">
                  {formatPrice(product.sale_price!)}
                </span>
                <span className="font-sans text-sm text-store-ink-muted line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="font-sans text-sm font-medium text-store-ink">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div
        className={cn(
          "px-4 pb-4 transition-opacity duration-200",
          "lg:invisible lg:opacity-0",
          "lg:group-hover:visible lg:group-hover:opacity-100",
          "lg:group-focus-within:visible lg:group-focus-within:opacity-100",
          "motion-reduce:transition-none"
        )}
      >
        <AddToCartButton />
      </div>
    </article>
  );
}
