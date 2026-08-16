"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { suggestVariantSku } from "@/lib/utils/variantMatrix";
import type { VariantFormInput } from "@/types";

interface VariantMatrixProps {
  slug: string;
  sizes: string[];
  colors: string[];
  value: VariantFormInput[];
  onChange: (variants: VariantFormInput[]) => void;
}

export function VariantMatrix({
  slug,
  sizes,
  colors,
  value,
  onChange,
}: VariantMatrixProps) {
  const updateRow = (index: number, patch: Partial<VariantFormInput>) => {
    onChange(value.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const setAllStock = (stock: number) => {
    onChange(value.map((row) => ({ ...row, stock_count: stock })));
  };

  const generateAllSkus = () => {
    onChange(
      value.map((row) => ({
        ...row,
        sku: suggestVariantSku(slug, row.size, row.color),
      }))
    );
  };

  const clearDisabled = () => {
    onChange(value.filter((row) => row.is_enabled));
  };

  if (!sizes.length || !colors.length) {
    return (
      <p className="text-sm v18-text-muted">
        Select at least one size and one colour to manage variant stock.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setAllStock(0)}>
          Set all stock to 0
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setAllStock(10)}>
          Set all stock to 10
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={generateAllSkus}>
          Generate all SKUs
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearDisabled}>
          Clear disabled
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-v18-border text-left">
              <th className="px-2 py-2 font-medium">Size</th>
              <th className="px-2 py-2 font-medium">Colour</th>
              <th className="px-2 py-2 font-medium">Stock</th>
              <th className="px-2 py-2 font-medium">SKU</th>
              <th className="px-2 py-2 font-medium">Price override</th>
              <th className="px-2 py-2 font-medium">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {value.map((row, index) => (
              <tr key={`${row.size}-${row.color}-${row.id ?? "new"}`} className="border-b border-v18-border/60">
                <td className="px-2 py-2">{row.size}</td>
                <td className="px-2 py-2 capitalize">{row.color}</td>
                <td className="px-2 py-2">
                  <Input
                    type="number"
                    min={0}
                    value={row.stock_count}
                    onChange={(event) =>
                      updateRow(index, {
                        stock_count: Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                    className="h-8 w-20"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    value={row.sku ?? ""}
                    onChange={(event) => updateRow(index, { sku: event.target.value })}
                    className="h-8 min-w-[10rem]"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.price_override ?? ""}
                    onChange={(event) =>
                      updateRow(index, {
                        price_override:
                          event.target.value === ""
                            ? null
                            : Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                    className="h-8 w-24"
                  />
                </td>
                <td className="px-2 py-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.is_enabled}
                      onChange={(event) =>
                        updateRow(index, { is_enabled: event.target.checked })
                      }
                    />
                    <span className="sr-only">Enabled</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs v18-text-muted">
        New size/colour combinations start disabled with zero stock. Variants tied
        to orders are soft-disabled instead of deleted.
      </p>
    </div>
  );
}
