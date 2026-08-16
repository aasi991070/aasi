"use client";

import { useRadioGroup } from "@/hooks/useRadioGroup";
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
  const { radiogroupProps, getItemProps } = useRadioGroup({
    items: sizes,
    value,
    onChange,
    getKey: (size) => size,
    isDisabled: (size) => unavailableSizes.includes(size),
    ariaLabel: "Size",
  });

  return (
    <div {...radiogroupProps} className="flex flex-wrap gap-2">
      {sizes.map((size, index) => {
        const unavailable = unavailableSizes.includes(size);
        const selected = value === size;
        const itemProps = getItemProps(index, size);

        return (
          <button
            key={size}
            type="button"
            {...itemProps}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 font-sans text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-store-accent-dark",
              unavailable &&
                "cursor-not-allowed border-store-border text-store-ink-muted line-through decoration-store-ink-muted decoration-solid decoration-1",
              !unavailable &&
                selected &&
                "border-store-ink bg-store-ink text-store-white",
              !unavailable &&
                !selected &&
                "border-store-border text-store-ink hover:border-store-ink"
            )}
          >
            {size}
            {unavailable ? (
              <span className="sr-only"> — out of stock</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
