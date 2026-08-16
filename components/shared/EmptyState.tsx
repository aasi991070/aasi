import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type EmptyStateSurface = "store" | "admin";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  surface?: EmptyStateSurface;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  surface = "store",
  className,
}: EmptyStateProps) {
  const isAdmin = surface === "admin";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-8 py-16 text-center",
        isAdmin
          ? "v18-card"
          : "store-hairline bg-store-white",
        className
      )}
    >
      <h3
        className={cn(
          "text-lg font-semibold",
          isAdmin ? "v18-text-heading" : "font-display text-xl font-normal text-store-ink"
        )}
      >
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            "mt-2 max-w-sm text-sm",
            isAdmin ? "v18-text-muted" : "font-sans text-store-ink-muted"
          )}
        >
          {description}
        </p>
      ) : null}
      {actionLabel && actionHref ? (
        <Button asChild className="mt-6">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
