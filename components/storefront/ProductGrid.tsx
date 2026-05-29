import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export function ProductGrid({ products, title }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="v18-card py-16 text-center">
        <p className="text-sm v18-text-muted">No products found.</p>
      </div>
    );
  }

  return (
    <section>
      {title && (
        <h2 className="mb-6 text-xl font-semibold v18-text-on-gradient">{title}</h2>
      )}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
