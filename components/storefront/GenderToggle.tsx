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
    <div className="inline-flex overflow-hidden rounded-[var(--radius-v18-btn)] border border-v18-border bg-white">
      {options.map((opt) => {
        const active = pathname.startsWith(opt.href);
        return (
          <Link
            key={opt.href}
            href={opt.href}
            className={cn(
              "px-5 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors",
              active
                ? "v18-btn-primary text-white"
                : "v18-text-muted hover:bg-slate-50"
            )}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
