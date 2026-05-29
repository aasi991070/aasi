import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  variant?: "onGradient" | "default";
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  variant = "onGradient",
  action,
  className,
}: PageHeaderProps) {
  const isGradient = variant === "onGradient";

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
            "text-[28px] font-semibold leading-tight",
            isGradient ? "v18-text-on-gradient" : "v18-text-heading"
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "mt-1 text-sm",
              isGradient ? "v18-text-muted-on-gradient" : "v18-text-muted"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
