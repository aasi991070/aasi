import { Skeleton } from "@/components/ui/skeleton";

export default function StorefrontLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-64 rounded-[var(--radius-v18-card)]" />
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-[var(--radius-v18-card)]" />
        ))}
      </div>
    </div>
  );
}
