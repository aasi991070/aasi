"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { isSupabaseStorageUrl, PLACEHOLDER_IMAGE } from "@/lib/storage/images";

type RemoteImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  fallbackSrc?: string;
};

export function RemoteImage({
  src,
  fallbackSrc = PLACEHOLDER_IMAGE,
  alt,
  unoptimized,
  ...props
}: RemoteImageProps) {
  const preferUnoptimized = unoptimized ?? isSupabaseStorageUrl(src);
  const [displaySrc, setDisplaySrc] = useState(src);
  const [useUnoptimized, setUseUnoptimized] = useState(preferUnoptimized);

  useEffect(() => {
    setDisplaySrc(src);
    setUseUnoptimized(unoptimized ?? isSupabaseStorageUrl(src));
  }, [src, unoptimized]);

  const handleError = () => {
    if (displaySrc === fallbackSrc) return;

    if (!useUnoptimized && isSupabaseStorageUrl(displaySrc)) {
      setUseUnoptimized(true);
      return;
    }

    setDisplaySrc(fallbackSrc);
  };

  return (
    <Image
      {...props}
      src={displaySrc}
      alt={alt}
      unoptimized={useUnoptimized}
      onError={handleError}
    />
  );
}
