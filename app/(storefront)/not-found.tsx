import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StorefrontNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center lg:px-8">
      <h1 className="font-display text-4xl font-light tracking-tight text-store-ink">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-sm text-store-ink-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
