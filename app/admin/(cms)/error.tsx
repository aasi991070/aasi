"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] render failed", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <div className="v18-card flex flex-col items-center justify-center px-6 py-20 text-center">
      <h2 className="text-lg font-semibold v18-text-heading">
        This page failed to load
      </h2>
      <p className="mt-2 max-w-md text-sm v18-text-muted">
        The database request behind this page did not complete. Nothing has been
        saved or changed.
      </p>

      {/* The admin is the operator, so the actual message is useful here in a
          way it would not be on the storefront. */}
      {error.message && (
        <p className="mt-4 max-w-md break-words rounded-[var(--radius-input)] border border-v18-border px-3 py-2 text-left font-mono text-xs v18-text-muted">
          {error.message}
        </p>
      )}

      <Button onClick={reset} className="mt-6 min-h-11">
        Try again
      </Button>

      {error.digest && (
        <p className="mt-4 text-xs v18-text-muted">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </div>
  );
}
