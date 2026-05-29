"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { SearchBar } from "./SearchBar";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/category/mens", label: "Men" },
    { href: "/category/womens", label: "Women" },
    { href: "/category/mens/clothing", label: "Clothing" },
    { href: "/category/mens/footwear", label: "Footwear" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-store-white shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sans text-xs font-normal uppercase tracking-[0.2em] text-store-ink transition-opacity hover:opacity-60"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        <button
          type="button"
          className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          Menu
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-store-border bg-store-white px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
