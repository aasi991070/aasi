"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the window has scrolled past `threshold` pixels. Kept in its
 * own hook so the storefront header can stay a server component and only the
 * thin wrapper around it needs to be a client component.
 */
export function useScrolled(threshold = 20): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return scrolled;
}
