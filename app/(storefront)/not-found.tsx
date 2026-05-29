import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";

export default function StorefrontNotFound() {
  return (
    <>
      <PageHeader title="Page Not Found" subtitle="The page you requested does not exist." />
      <div className="v18-card flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm v18-text-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </>
  );
}
