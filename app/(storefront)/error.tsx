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
    // digest is the only handle on the server-side stack, which Next strips
    // from the client payload in production. Without it a report is unusable.
    console.error("[storefront] render failed", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center lg:px-8">
      <h2 className="font-display text-3xl font-light tracking-tight text-store-ink">
        We couldn&apos;t load this page
      </h2>
      <p className="mt-4 max-w-md text-sm text-store-ink-muted">
        Something went wrong on our side, not yours. The page may load correctly
        if you try again in a moment.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button type="button" variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-store-ink-muted">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </div>
  );
}
