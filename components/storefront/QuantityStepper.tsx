"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  max: number;
  onCommit: (qty: number) => void;
  onRemove?: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function QuantityStepper({
  value,
  max,
  onCommit,
  onRemove,
  label,
  disabled = false,
  className,
}: QuantityStepperProps) {
  const [localQty, setLocalQty] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCommitRef = useRef(onCommit);

  useEffect(() => {
    latestCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    setLocalQty(value);
  }, [value]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const scheduleCommit = (nextQty: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      latestCommitRef.current(nextQty);
    }, 400);
  };

  const clamp = (qty: number) => Math.max(1, Math.min(qty, Math.max(1, max)));

  const updateQty = (nextQty: number) => {
    if (nextQty < 1) {
      onRemove?.();
      return;
    }

    const clamped = clamp(nextQty);
    setLocalQty(clamped);
    scheduleCommit(clamped);
  };

  const atMax = localQty >= max;

  return (
    <div className={cn("inline-flex items-center border border-store-border", className)}>
      <button
        type="button"
        aria-label={`Decrease quantity for ${label}`}
        disabled={disabled}
        onClick={() => updateQty(localQty - 1)}
        className="inline-flex size-10 items-center justify-center text-store-ink transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:text-store-ink-muted"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="min-w-10 text-center font-sans text-sm text-store-ink"
      >
        {localQty}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity for ${label}`}
        disabled={disabled || atMax}
        onClick={() => updateQty(localQty + 1)}
        className="inline-flex size-10 items-center justify-center text-store-ink transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:text-store-ink-muted"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
