"use client";

import { COLOR_MAP } from "@/constants";
import { cn } from "@/lib/utils/cn";

interface ColorSelectorProps {
  colors: string[];
  value?: string;
  onChange?: (color: string) => void;
}

export function ColorSelector({ colors, value, onChange }: ColorSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => {
        const hex = COLOR_MAP[color.toLowerCase()] ?? "#9ca3af";
        const selected = value === color;

        return (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => onChange?.(color)}
            className={cn(
              "relative size-8 rounded-full border-2 transition-transform hover:scale-110",
              selected ? "border-v18-primary" : "border-transparent"
            )}
            style={{ backgroundColor: hex }}
          >
            <span className="sr-only">{color}</span>
          </button>
        );
      })}
    </div>
  );
}
