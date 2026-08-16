"use client";

import { useState } from "react";
import { SIZES } from "@/constants";
import { cn } from "@/lib/utils";

type Unit = "cm" | "in";

const MEASUREMENT_ROWS = [
  "Chest",
  "Waist",
  "Hip",
  "Shoulder",
  "Sleeve",
  "Length",
] as const;

export function SizeGuideTable() {
  const [unit, setUnit] = useState<Unit>("cm");

  return (
    <div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setUnit("cm")}
          aria-pressed={unit === "cm"}
          className={cn(
            "font-sans text-xs uppercase tracking-[0.2em] transition-opacity",
            unit === "cm"
              ? "text-store-ink"
              : "text-store-ink-muted hover:text-store-ink"
          )}
        >
          Centimetres
        </button>
        <button
          type="button"
          onClick={() => setUnit("in")}
          aria-pressed={unit === "in"}
          className={cn(
            "font-sans text-xs uppercase tracking-[0.2em] transition-opacity",
            unit === "in"
              ? "text-store-ink"
              : "text-store-ink-muted hover:text-store-ink"
          )}
        >
          Inches
        </button>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left font-sans text-sm">
          <caption className="sr-only">
            Size chart in {unit === "cm" ? "centimetres" : "inches"}
          </caption>
          <thead>
            <tr className="border-b border-store-border">
              <th
                scope="col"
                className="py-3 pr-4 font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
              >
                Measurement
              </th>
              {SIZES.map((size) => (
                <th
                  key={size}
                  scope="col"
                  className="px-3 py-3 font-sans text-xs uppercase tracking-[0.15em] text-store-ink"
                >
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEASUREMENT_ROWS.map((row) => (
              <tr key={row} className="border-b border-store-border">
                <th
                  scope="row"
                  className="py-3 pr-4 font-medium text-store-ink"
                >
                  {row}
                </th>
                {SIZES.map((size) => (
                  <td
                    key={size}
                    className="px-3 py-3 text-store-ink-muted"
                  >
                    [[SIZE_CHART_TBC]] {unit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
