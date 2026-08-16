"use client";

import { COLOR_MAP } from "@/constants";
import { useRadioGroup } from "@/hooks/useRadioGroup";
import { cn } from "@/lib/utils/cn";

interface ColorSelectorProps {
  colors: string[];
  value?: string;
  onChange?: (color: string) => void;
}

function resolveColorHex(color: string): { hex: string; mapped: boolean } {
  const hex = COLOR_MAP[color.toLowerCase()];
  if (hex) return { hex, mapped: true };
  return { hex: "#9ca3af", mapped: false };
}

export function ColorSelector({ colors, value, onChange }: ColorSelectorProps) {
  const { radiogroupProps, getItemProps } = useRadioGroup({
    items: colors,
    value,
    onChange,
    getKey: (color) => color,
    ariaLabel: "Colour",
  });

  return (
    <div {...radiogroupProps} className="flex flex-wrap gap-3">
      {colors.map((color, index) => {
        const { hex, mapped } = resolveColorHex(color);
        const selected = value === color;
        const itemProps = getItemProps(index, color);

        return (
          <button
            key={color}
            type="button"
            title={mapped ? color : `${color} (unmapped)`}
            {...itemProps}
            className={cn(
              "inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5 px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-store-accent-dark"
            )}
          >
            <span
              className={cn(
                "size-8 shrink-0 rounded-full border border-store-border",
                selected &&
                  "shadow-[0_0_0_2px_var(--color-store-white),0_0_0_4px_var(--color-store-ink)]"
              )}
              style={{ backgroundColor: hex }}
              aria-hidden="true"
            />
            <span className="max-w-16 truncate font-sans text-[10px] uppercase tracking-wide text-store-ink">
              {color}
            </span>
          </button>
        );
      })}
    </div>
  );
}
