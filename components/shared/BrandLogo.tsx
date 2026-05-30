import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@/constants";
import { cn } from "@/lib/utils/cn";

interface BrandLogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
  compact?: boolean;
  priority?: boolean;
  variant?: "default" | "sidebar";
}

export function BrandLogo({
  href = "/",
  className,
  imageClassName,
  compact = false,
  priority = false,
  variant = "default",
}: BrandLogoProps) {
  const image = (
    <Image
      src={BRAND_LOGO_PATH}
      alt={`${BRAND_NAME} Collection`}
      width={compact ? 40 : 140}
      height={compact ? 40 : 48}
      className={cn(
        "h-auto w-auto object-contain",
        compact ? "max-h-9 max-w-9" : "max-h-11 max-w-[140px]",
        variant === "sidebar" && "rounded-md bg-white px-1 py-0.5",
        imageClassName
      )}
      priority={priority}
    />
  );

  if (!href) {
    return <div className={className}>{image}</div>;
  }

  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)} aria-label={`${BRAND_NAME} home`}>
      {image}
    </Link>
  );
}
