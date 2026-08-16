import { cn } from "@/lib/utils/cn";

type PageHeaderSurface = "store" | "admin";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  variant?: "onGradient" | "default";
  surface?: PageHeaderSurface;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  variant = "default",
  surface = "store",
  action,
  className,
}: PageHeaderProps) {
  const isAdmin = surface === "admin";
  const isGradient = isAdmin && variant === "onGradient";

  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <h1
          className={cn(
            "leading-tight",
            isAdmin
              ? cn(
                  "text-[28px] font-semibold",
                  isGradient ? "v18-text-on-gradient" : "v18-text-heading"
                )
              : "font-display text-3xl font-normal text-store-ink md:text-4xl"
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "mt-1 text-sm",
              isAdmin
                ? isGradient
                  ? "v18-text-muted-on-gradient"
                  : "v18-text-muted"
                : "font-sans text-store-ink-muted"
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
