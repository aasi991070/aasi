"use client";

import { useCallback, useState } from "react";
import { deleteImage, getPublicUrl, uploadImage } from "@/lib/storage/images";

export function useImageUpload(folder = "products") {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (files: File[]): Promise<string[]> => {
      setUploading(true);
      setProgress(0);
      const paths: string[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const path = await uploadImage(files[i], folder);
          paths.push(path);
          setProgress(Math.round(((i + 1) / files.length) * 100));
        }
        return paths;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [folder]
  );

  const remove = useCallback(async (path: string) => {
    await deleteImage(path);
  }, []);

  const toPublicUrl = useCallback((path: string) => getPublicUrl(path), []);

  return { upload, remove, toPublicUrl, uploading, progress };
}
