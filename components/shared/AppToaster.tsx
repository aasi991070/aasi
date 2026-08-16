"use client";

import { useMonochrome } from "@/components/providers/MonochromeProvider";
import { Toaster } from "@/components/ui/sonner";

export function AppToaster() {
  const { monochrome } = useMonochrome();

  return (
    <Toaster richColors={!monochrome} closeButton position="top-right" />
  );
}
