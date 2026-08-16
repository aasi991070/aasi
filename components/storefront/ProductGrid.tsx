import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  title?: string;
  /** First N cards pass `priority` to their hero image. Defaults to one row. */
  priority?: number;
  priorityCount?: number;
}

export function ProductGrid({
  products,
  title,
  priority,
  priorityCount,
}: ProductGridProps) {
  const imagePriorityCount = priority ?? priorityCount ?? 4;
  if (!products.length) {
    return (
      <div className="store-hairline px-6 py-16 text-center">
        <p className="font-sans text-sm text-store-ink-muted">
          No products found.
        </p>
      </div>
    );
  }

  return (
    <section>
      {title ? (
        <h2 className="mb-8 font-display text-2xl font-normal text-store-ink md:text-3xl">
          {title}
        </h2>
      ) : null}
      <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < imagePriorityCount}
          />
        ))}
      </div>
    </section>
  );
}
