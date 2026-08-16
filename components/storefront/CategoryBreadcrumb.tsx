import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category } from "@/types";

interface CategoryBreadcrumbProps {
  items: Category[];
}

export function CategoryBreadcrumb({ items }: CategoryBreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex flex-wrap items-center gap-1 font-sans text-xs text-store-ink-muted"
    >
      <Link href="/" className="transition-colors hover:text-store-ink">
        Home
      </Link>
      {items.map((item, index) => {
        const slugPath = items
          .slice(0, index + 1)
          .map((category) => category.slug)
          .join("/");

        return (
          <span key={item.id} className="flex items-center gap-1">
            <ChevronRight className="size-3 text-store-ink-muted" aria-hidden="true" />
            {index === items.length - 1 ? (
              <span className="text-store-ink">{item.name}</span>
            ) : (
              <Link
                href={`/category/${slugPath}`}
                className="transition-colors hover:text-store-ink"
              >
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
