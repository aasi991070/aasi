import Image, { type ImageProps } from "next/image";
import { getBlurDataUrl } from "@/lib/storage/images";

type RemoteImageProps = Omit<ImageProps, "src" | "placeholder" | "blurDataURL"> & {
  src: string;
  /** Pass false to skip the static blur placeholder on non-product imagery. */
  withBlur?: boolean;
};

/**
 * Server-side image wrapper. Always routes through Next's optimiser — never sets
 * `unoptimized`. Storefront components should import this, not the client
 * fallback variant.
 */
export function RemoteImage({
  src,
  alt,
  withBlur = true,
  ...props
}: RemoteImageProps) {
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      placeholder={withBlur ? "blur" : undefined}
      blurDataURL={withBlur ? getBlurDataUrl() : undefined}
    />
  );
}
