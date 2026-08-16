"use client";

import { useCallback, useState } from "react";
import {
  ImageUploadError,
  prepareImageUpload,
} from "@/lib/storage/prepareImageUpload";
import { deleteImage, getPublicUrl, uploadImage } from "@/lib/storage/images";

export function useImageUpload(folder = "products") {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (files: File[]): Promise<string[]> => {
      setUploading(true);
      setProgress(0);
      setError(null);

      let completed = 0;

      try {
        const paths = await Promise.all(
          files.map(async (file) => {
            const prepared = await prepareImageUpload(file);
            const path = await uploadImage(prepared, folder);
            completed += 1;
            setProgress(Math.round((completed / files.length) * 100));
            return path;
          })
        );
        return paths;
      } catch (err) {
        const message =
          err instanceof ImageUploadError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Upload failed.";
        setError(message);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [folder]
  );

  const remove = useCallback(async (path: string) => {
    await deleteImage(path);
  }, []);

  const toPublicUrl = useCallback((path: string) => getPublicUrl(path), []);

  const clearError = useCallback(() => setError(null), []);

  return {
    upload,
    remove,
    toPublicUrl,
    uploading,
    progress,
    error,
    clearError,
  };
}
