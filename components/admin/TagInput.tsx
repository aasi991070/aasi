"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

interface TagInputProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  normalize?: (tag: string) => string;
  className?: string;
}

export function TagInput({
  id,
  value,
  onChange,
  placeholder = "Type and press Enter",
  normalize,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const next = normalize ? normalize(trimmed) : trimmed;
    if (!next || value.includes(next)) {
      setDraft("");
      return;
    }

    onChange([...value, next]);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((entry) => entry !== tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag(draft);
      return;
    }

    if (event.key === "Backspace" && !draft && value.length) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-[var(--radius-input)] border border-v18-border bg-white px-3 py-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-v18-border px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-slate-100"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length ? undefined : placeholder}
          className="h-7 min-w-[8rem] flex-1 border-0 px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <p className="text-xs v18-text-muted">Press Enter to add. Backspace removes the last chip.</p>
    </div>
  );
}
