"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StorefrontSearchProps {
  className?: string;
  inputClassName?: string;
}

export function StorefrontSearch({
  className,
  inputClassName,
}: StorefrontSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-store-ink-muted"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className={cn(
            "h-10 w-56 rounded-none border-x-0 border-t-0 border-b border-store-border bg-transparent pl-6 pr-0 font-sans text-sm text-store-ink shadow-none placeholder:text-store-ink-muted focus-visible:border-store-accent-dark focus-visible:ring-0 lg:w-64",
            inputClassName
          )}
          aria-label="Search products"
        />
      </div>
    </form>
  );
}
