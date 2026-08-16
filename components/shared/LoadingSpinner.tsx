import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type LoadingSpinnerSurface = "store" | "admin";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  surface?: LoadingSpinnerSurface;
}

const sizeMap = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

export function LoadingSpinner({
  className,
  size = "md",
  surface = "store",
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin",
        surface === "admin" ? "text-v18-primary" : "text-store-accent-dark",
        sizeMap[size],
        className
      )}
      aria-label="Loading"
    />
  );
}
