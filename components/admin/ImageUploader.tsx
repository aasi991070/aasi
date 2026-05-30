"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils/cn";

interface ImageUploaderProps {
  value: string[];
  onChange: (paths: string[]) => void;
  folder?: string;
}

export function ImageUploader({
  value,
  onChange,
  folder = "products",
}: ImageUploaderProps) {
  const { upload, remove, toPublicUrl, uploading, progress } =
    useImageUpload(folder);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (!fileArray.length) return;
      const paths = await upload(fileArray);
      onChange([...value, ...paths]);
    },
    [upload, value, onChange]
  );

  const handleRemove = async (path: string) => {
    try {
      await remove(path);
    } catch {
      // Still remove from form if storage delete fails
    }
    onChange(value.filter((p) => p !== path));
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
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </label>
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
        <div className="grid grid-cols-3 gap-3">
          {value.map((path) => (
            <div
              key={path}
              className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
            >
              <Image
                src={toPublicUrl(path)}
                alt="Uploaded"
                fill
                className="object-cover"
                sizes="120px"
              />
              <button
                type="button"
                onClick={() => handleRemove(path)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
