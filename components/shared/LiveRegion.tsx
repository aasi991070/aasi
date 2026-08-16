"use client";

import { useLiveRegionStore } from "@/hooks/useLiveRegionStore";

export function LiveRegion() {
  const message = useLiveRegionStore((state) => state.message);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
