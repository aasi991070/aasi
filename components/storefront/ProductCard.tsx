"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { resolveImageUrl, getProductImagePaths } from "@/lib/storage/images";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imagePath = getProductImagePaths(product)[0];
  const imageUrl = resolveImageUrl(imagePath);

  const hasSale = product.sale_price != null && product.sale_price < product.price;

  return (
    <motion.article className="v18-card group overflow-hidden p-0" whileHover="hover" initial="rest">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
          <motion.div
            className="relative size-full"
            variants={{
              rest: { scale: 1 },
              hover: { scale: 1.03 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <RemoteImage
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </motion.div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-medium v18-text-heading">{product.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            {hasSale ? (
              <>
                <span className="text-sm font-semibold text-v18-primary">
                  {formatPrice(product.sale_price!)}
                </span>
                <span className="text-sm v18-text-muted line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold v18-text-heading">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          className="v18-btn-primary w-full py-2.5 text-xs font-medium uppercase tracking-[0.1em]"
        >
          Add to Cart
        </button>
      </div>
    </motion.article>
  );
}
