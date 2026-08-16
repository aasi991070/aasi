import { cn } from "@/lib/utils/cn";

type PageHeaderSurface = "store" | "admin";
type PageHeaderTag = "h1" | "h2" | "h3";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  variant?: "onGradient" | "default";
  surface?: PageHeaderSurface;
  as?: PageHeaderTag;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  variant = "default",
  surface = "store",
  as: Heading = "h2",
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
        <Heading
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
        </Heading>
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
