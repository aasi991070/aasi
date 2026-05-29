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
    console.error(error);
  }, [error]);

  return (
    <div className="v18-card flex flex-col items-center justify-center py-20">
      <h2 className="text-lg font-semibold v18-text-heading">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm v18-text-muted">
        An error occurred loading this page.
      </p>
      <Button onClick={reset} className="mt-6 min-h-11">
        Try again
      </Button>
    </div>
  );
}
