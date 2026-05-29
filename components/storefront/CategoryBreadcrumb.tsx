import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types";

interface CategoryBreadcrumbProps {
  items: Category[];
  onGradient?: boolean;
}

export function CategoryBreadcrumb({ items, onGradient = false }: CategoryBreadcrumbProps) {
  if (!items.length) return null;

  const linkClass = onGradient
    ? "text-xs text-white/70 hover:text-white"
    : "text-xs v18-text-muted hover:text-v18-heading";
  const currentClass = onGradient ? "text-xs text-white" : "text-xs v18-text-heading";
  const separatorClass = onGradient ? "text-white/50" : "text-v18-muted";

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1">
      <Link href="/" className={linkClass}>
        Home
      </Link>
      {items.map((item, i) => {
        const slugPath = items.slice(0, i + 1).map((c) => c.slug).join("/");

        return (
          <span key={item.id} className="flex items-center gap-1">
            <ChevronRight className={cn("size-3", separatorClass)} />
            {i === items.length - 1 ? (
              <span className={currentClass}>{item.name}</span>
            ) : (
              <Link href={`/category/${slugPath}`} className={linkClass}>
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
