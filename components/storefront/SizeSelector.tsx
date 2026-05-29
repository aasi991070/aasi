"use client";

import { cn } from "@/lib/utils/cn";

interface SizeSelectorProps {
  sizes: string[];
  unavailableSizes?: string[];
  value?: string;
  onChange?: (size: string) => void;
}

export function SizeSelector({
  sizes,
  unavailableSizes = [],
  value,
  onChange,
}: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const unavailable = unavailableSizes.includes(size);
        const selected = value === size;

        return (
          <button
            key={size}
            type="button"
            disabled={unavailable}
            onClick={() => !unavailable && onChange?.(size)}
            className={cn(
              "min-w-12 rounded-full border px-4 py-2 text-xs transition-colors",
              unavailable && "cursor-not-allowed opacity-40 line-through",
              !unavailable && selected && "border-v18-primary bg-v18-primary text-white",
              !unavailable &&
                !selected &&
                "border-v18-border v18-text-heading hover:border-v18-primary"
            )}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
