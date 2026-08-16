import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  asLink?: boolean;
  className?: string;
};

const markClassName =
  "font-display inline-block text-[1.75rem] font-normal leading-none tracking-[0.22em] text-store-ink";

export function BrandMark({ asLink = true, className }: BrandMarkProps) {
  const classes = cn(markClassName, className);

  if (asLink) {
    return (
      <Link href="/" className={classes} aria-label="Aasi home">
        Aasi
      </Link>
    );
  }

  return <span className={classes}>Aasi</span>;
}
