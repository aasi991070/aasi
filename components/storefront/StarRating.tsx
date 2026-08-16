"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  showValue?: boolean;
}

export function StarRating({
  value,
  onChange,
  size = "md",
  showValue = false,
}: StarRatingProps) {
  const iconSize = size === "sm" ? "size-4" : "size-5";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.round(value);

        if (onChange) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(starValue)}
              className="text-store-accent transition-colors hover:scale-110"
              aria-label={`Rate ${starValue} stars`}
            >
              <Star
                className={cn(iconSize, filled ? "fill-current" : "opacity-30")}
              />
            </button>
          );
        }

        return (
          <Star
            key={i}
            className={cn(
              iconSize,
              filled ? "fill-store-accent text-store-accent" : "text-store-border"
            )}
          />
        );
      })}
      {showValue && value > 0 ? (
        <span className="ml-1 font-sans text-sm text-store-ink-muted">
          {value.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
}
