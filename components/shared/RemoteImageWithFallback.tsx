"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { PLACEHOLDER_IMAGE } from "@/lib/storage/images";

type RemoteImageWithFallbackProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  fallbackSrc?: string;
};

/**
 * Client-only image with an onError → placeholder fallback. Used in admin
 * surfaces where uploads may 404 while a form is being edited.
 */
export function RemoteImageWithFallback({
  src,
  fallbackSrc = PLACEHOLDER_IMAGE,
  alt,
  ...props
}: RemoteImageWithFallbackProps) {
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    setDisplaySrc(src);
  }, [src]);

  const handleError = () => {
    if (displaySrc !== fallbackSrc) {
      setDisplaySrc(fallbackSrc);
    }
  };

  return (
    <Image {...props} src={displaySrc} alt={alt} onError={handleError} />
  );
}
