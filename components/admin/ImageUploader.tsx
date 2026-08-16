"use client";

import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { RemoteImageWithFallback } from "@/components/shared/RemoteImageWithFallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils/cn";

interface ImageUploaderProps {
  value: string[];
  onChange: (paths: string[]) => void;
  altTexts?: string[];
  onAltTextsChange?: (alts: string[]) => void;
  folder?: string;
}

export function ImageUploader({
  value,
  onChange,
  altTexts = [],
  onAltTextsChange,
  folder = "products",
}: ImageUploaderProps) {
  const { upload, remove, toPublicUrl, uploading, progress, error, clearError } =
    useImageUpload(folder);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      clearError();
      const fileArray = Array.from(files);
      if (!fileArray.length) return;
      try {
        const paths = await upload(fileArray);
        onChange([...value, ...paths]);
        onAltTextsChange?.([...altTexts, ...paths.map(() => "")]);
      } catch {
        // Error state is surfaced via `error` from the hook.
      }
    },
    [clearError, upload, value, onChange, altTexts, onAltTextsChange]
  );

  const handleRemove = async (path: string, index: number) => {
    try {
      await remove(path);
    } catch {
      // Still remove from form if storage delete fails
    }
    onChange(value.filter((p) => p !== path));
    if (onAltTextsChange) {
      onAltTextsChange(altTexts.filter((_, altIndex) => altIndex !== index));
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-[var(--radius-input)] border-2 border-dashed border-v18-border px-6 py-10 transition-colors",
          dragOver && "v18-drag-over"
        )}
      >
        <Upload className="size-8 v18-text-muted" strokeWidth={1.5} />
        <p className="mt-3 text-sm v18-text-muted">
          Drag and drop images, or click to browse
        </p>
        <label className="mt-4">
          <Button type="button" variant="outline" className="cursor-pointer" asChild>
            <span>Browse files</span>
          </Button>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </label>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {uploading && (
          <div className="mt-4 w-full max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-v18-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs v18-text-muted">
              Uploading {progress}%
            </p>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {value.map((path, index) => (
            <div key={path} className="space-y-2">
              <div className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                <RemoteImageWithFallback
                  src={toPublicUrl(path)}
                  alt={altTexts[index]?.trim() || "Uploaded product image"}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(path, index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
              {onAltTextsChange ? (
                <Input
                  value={altTexts[index] ?? ""}
                  onChange={(event) => {
                    const next = [...altTexts];
                    next[index] = event.target.value;
                    onAltTextsChange(next);
                  }}
                  placeholder="Alt text"
                  className="h-8 text-xs"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
