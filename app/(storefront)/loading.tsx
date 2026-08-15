import { Skeleton } from "@/components/ui/skeleton";

export default function StorefrontLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-16 lg:px-8">
      <Skeleton className="h-10 w-64" />
      {/* Matches the 3/4 product aspect ratio and 32px grid gap the storefront
          design rule mandates, so the page does not jump when content lands. */}
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4]" />
        ))}
      </div>
    </div>
  );
}
