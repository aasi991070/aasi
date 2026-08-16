import Link from "next/link";
import type { ReactNode } from "react";
import { CategoryBreadcrumb } from "@/components/storefront/CategoryBreadcrumb";
import { formatPrice } from "@/lib/utils/formatPrice";
import { splitDescriptionParagraphs } from "@/lib/utils/formatDescription";
import { getCategoryHref } from "@/lib/utils/getGenderCategory";
import type { Category, Product } from "@/types";

type ProductInfoProps = {
  product: Product;
  breadcrumb: Category[];
  genderCategory?: Category;
  purchasePanel: ReactNode;
};

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group border-t border-store-border py-5"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none font-sans text-xs uppercase tracking-[0.2em] text-store-ink [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between">
          {title}
          <span
            aria-hidden="true"
            className="text-store-ink-muted transition-transform group-open:rotate-45"
          >
            +
          </span>
        </span>
      </summary>
      <div className="mt-4 space-y-3 font-sans text-sm leading-relaxed text-store-ink-muted">
        {children}
      </div>
    </details>
  );
}

export function ProductInfo({
  product,
  breadcrumb,
  genderCategory,
  purchasePanel,
}: ProductInfoProps) {
  const descriptionParagraphs = splitDescriptionParagraphs(product.description);
  const hasSale =
    product.sale_price != null && product.sale_price < product.price;

  return (
    <div>
      <CategoryBreadcrumb items={breadcrumb} />

      {genderCategory ? (
        <Link
          href={getCategoryHref([genderCategory])}
          className="mb-4 inline-flex font-sans text-xs uppercase tracking-[0.2em] text-store-accent-dark transition-opacity hover:opacity-70"
        >
          {genderCategory.name}
        </Link>
      ) : null}

      <h1 className="font-display text-3xl font-normal tracking-tight text-store-ink md:text-4xl">
        {product.name}
      </h1>

      <div className="mt-4 flex items-center gap-3">
        {hasSale ? (
          <>
            <span className="font-sans text-xl font-medium text-store-accent">
              {formatPrice(product.sale_price!)}
            </span>
            <span className="font-sans text-lg text-store-ink-muted line-through">
              {formatPrice(product.price)}
            </span>
          </>
        ) : (
          <span className="font-sans text-xl font-medium text-store-ink">
            {formatPrice(product.price)}
          </span>
        )}
      </div>

      <div className="mt-8 border-t border-store-border pt-8">{purchasePanel}</div>

      <div className="mt-10">
        <AccordionSection title="Description" defaultOpen>
          {descriptionParagraphs.length > 0 ? (
            descriptionParagraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))
          ) : (
            <p>Product details will be added soon.</p>
          )}
        </AccordionSection>

        <AccordionSection title="Fabric &amp; Care">
          <p>
            Composition and care instructions for this piece will be published
            here. Follow the garment label for best results.
          </p>
        </AccordionSection>

        <AccordionSection title="Shipping &amp; Returns">
          <p>
            Standard delivery timelines and return eligibility are outlined on
            our{" "}
            <Link href="/shipping" className="text-store-ink underline-offset-4 hover:underline">
              Shipping &amp; Delivery
            </Link>{" "}
            and{" "}
            <Link href="/returns" className="text-store-ink underline-offset-4 hover:underline">
              Returns &amp; Exchanges
            </Link>{" "}
            pages.
          </p>
        </AccordionSection>
      </div>
    </div>
  );
}
