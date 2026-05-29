import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  asLink?: boolean;
  className?: string;
};

const markClassName =
  "font-logo inline-block text-[1.7rem] font-extrabold leading-none tracking-[0.18em] text-store-ink";

export function BrandMark({ asLink = true, className }: BrandMarkProps) {
  const classes = cn(markClassName, className);

  if (asLink) {
    return (
      <Link href="/" className={classes} aria-label="Aasii home">
        Aasii
      </Link>
    );
  }

  return <span className={classes}>Aasii</span>;
}
