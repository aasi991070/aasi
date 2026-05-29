"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="v18-card flex min-h-[40vh] flex-col items-center justify-center px-6 py-16 text-center">
      <h2 className="text-xl font-semibold v18-text-heading">Something went wrong</h2>
      <p className="mt-4 text-sm v18-text-muted">
        We encountered an error loading this page.
      </p>
      <div className="mt-8 flex gap-4">
        <Button type="button" variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
