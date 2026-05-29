import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

export function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-v18-primary", sizeMap[size], className)}
      aria-label="Loading"
    />
  );
}
