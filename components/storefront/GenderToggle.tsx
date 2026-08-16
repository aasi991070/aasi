"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function GenderToggle() {
  const pathname = usePathname();

  const options = [
    { label: "Men's", href: "/category/mens" },
    { label: "Women's", href: "/category/womens" },
  ];

  return (
    <div className="inline-flex overflow-hidden border border-store-border bg-store-white">
      {options.map((opt) => {
        const active = pathname.startsWith(opt.href);
        return (
          <Link
            key={opt.href}
            href={opt.href}
            className={cn(
              "min-h-11 px-5 py-2.5 font-sans text-xs uppercase tracking-[0.15em] transition-colors",
              active
                ? "bg-store-accent text-store-white"
                : "text-store-ink-muted hover:bg-store-surface hover:text-store-ink"
            )}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
