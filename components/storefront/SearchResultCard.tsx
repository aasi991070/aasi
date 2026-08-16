import Link from "next/link";
import { RemoteImage } from "@/components/shared/RemoteImage";
import { getProductImagePaths, resolveImageUrl } from "@/lib/storage/images";
import { formatPrice } from "@/lib/utils/formatPrice";
import { HighlightText } from "@/lib/utils/highlightText";
import { excerptAroundMatch, tokenizeQuery } from "@/lib/utils/searchText";
import { getCategoryBreadcrumbPath, getCategoryHref } from "@/lib/utils/getGenderCategory";
import type { Category, Product } from "@/types";

interface SearchResultCardProps {
  product: Product;
  matchedFields: string[];
  query: string;
  allCategories: Category[];
}

export function SearchResultCard({
  product,
  matchedFields,
  query,
  allCategories,
}: SearchResultCardProps) {
  const tokens = tokenizeQuery(query);
  const imagePath = getProductImagePaths(product)[0];
  const imageUrl = imagePath ? resolveImageUrl(imagePath) : null;

  const categoryPath = getCategoryBreadcrumbPath(
    product.category_id,
    allCategories
  );
  const categoryLabel = categoryPath.map((c) => c.name).join(" › ");

  return (
    <article className="store-hairline flex gap-4 bg-store-white p-4 md:p-6">
      <Link
        href={`/product/${product.slug}`}
        className="relative size-24 shrink-0 overflow-hidden bg-store-surface md:size-28"
      >
        {imageUrl ? (
          <RemoteImage
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/product/${product.slug}`}
          className="font-sans text-base font-medium text-store-ink transition-colors hover:text-store-accent-dark"
        >
          <HighlightText text={product.name} tokens={tokens} />
        </Link>

        <p className="mt-1 font-sans text-sm font-medium text-store-accent-dark">
          {formatPrice(product.sale_price ?? product.price)}
        </p>

        {matchedFields.includes("description") && product.description ? (
          <p className="mt-2 font-sans text-sm text-store-ink-muted">
            <HighlightText
              text={excerptAroundMatch(product.description, tokens)}
              tokens={tokens}
            />
          </p>
        ) : null}

        {matchedFields.includes("tags") && product.tags.length > 0 ? (
          <p className="mt-2 font-sans text-xs text-store-ink-muted">
            Tags:{" "}
            <HighlightText text={product.tags.join(", ")} tokens={tokens} />
          </p>
        ) : null}

        {matchedFields.includes("category") && categoryLabel ? (
          <p className="mt-2 font-sans text-xs text-store-ink-muted">
            Category:{" "}
            <Link
              href={getCategoryHref(categoryPath)}
              className="text-store-ink underline-offset-4 hover:underline"
            >
              <HighlightText text={categoryLabel} tokens={tokens} />
            </Link>
          </p>
        ) : null}

        {matchedFields.includes("gender") && product.gender ? (
          <p className="mt-1 font-sans text-xs text-store-ink-muted">
            Gender: <HighlightText text={product.gender} tokens={tokens} />
          </p>
        ) : null}
      </div>
    </article>
  );
}
