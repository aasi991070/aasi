import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("v18-card flex flex-col items-center justify-center px-8 py-16 text-center", className)}>
      <h3 className="text-lg font-semibold v18-text-heading">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm v18-text-muted">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Button asChild className="mt-6">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
