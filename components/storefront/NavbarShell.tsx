"use client";

import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/utils";

/**
 * The sticky <header> element. Only exists so `Navbar` itself can stay on the
 * server: everything client-side about the header is the scroll listener.
 *
 * The `has-[...]` variants make the bar opaque whenever the mega panel is open,
 * even at scroll top, so the panel does not appear to float away from it.
 */
export function NavbarShell({ children }: { children: React.ReactNode }) {
  const scrolled = useScrolled(20);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        "has-[[data-mega-panel]]:border-b has-[[data-mega-panel]]:border-store-border has-[[data-mega-panel]]:bg-store-white",
        scrolled
          ? "border-b border-store-border bg-store-white"
          : "border-b border-transparent bg-transparent"
      )}
    >
      {children}
    </header>
  );
}
