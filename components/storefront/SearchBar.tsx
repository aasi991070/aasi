"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/category/mens?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-store-ink-muted" />
      <input
        type="search"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-48 border-b border-store-border bg-transparent py-2 pl-9 pr-2 font-sans text-sm text-store-ink placeholder:text-store-ink-muted focus:border-store-ink focus:outline-none"
      />
    </form>
  );
}
