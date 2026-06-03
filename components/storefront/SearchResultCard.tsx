import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/formatPrice";
import { getPublicUrl } from "@/lib/storage/images";
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
  const imagePath = product.thumbnail_url ?? product.images[0];
  const imageUrl = imagePath?.startsWith("http")
    ? imagePath
    : imagePath
      ? getPublicUrl(imagePath)
      : null;

  const categoryPath = getCategoryBreadcrumbPath(
    product.category_id,
    allCategories
  );
  const categoryLabel = categoryPath.map((c) => c.name).join(" › ");

  return (
    <article className="v18-card flex gap-4 overflow-hidden p-4">
      <Link
        href={`/product/${product.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-slate-100"
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/product/${product.slug}`}
          className="text-base font-semibold v18-text-heading hover:text-v18-primary"
        >
          <HighlightText text={product.name} tokens={tokens} />
        </Link>

        <p className="mt-1 text-sm font-medium text-v18-primary">
          {formatPrice(product.sale_price ?? product.price)}
        </p>

        {matchedFields.includes("description") && product.description && (
          <p className="mt-2 text-sm v18-text-muted">
            <HighlightText
              text={excerptAroundMatch(product.description, tokens)}
              tokens={tokens}
            />
          </p>
        )}

        {matchedFields.includes("tags") && product.tags.length > 0 && (
          <p className="mt-2 text-xs v18-text-muted">
            Tags:{" "}
            <HighlightText text={product.tags.join(", ")} tokens={tokens} />
          </p>
        )}

        {matchedFields.includes("category") && categoryLabel && (
          <p className="mt-2 text-xs v18-text-muted">
            Category:{" "}
            <Link
              href={getCategoryHref(categoryPath)}
              className="text-v18-primary hover:underline"
            >
              <HighlightText text={categoryLabel} tokens={tokens} />
            </Link>
          </p>
        )}

        {matchedFields.includes("gender") && product.gender && (
          <p className="mt-1 text-xs v18-text-muted">
            Gender: <HighlightText text={product.gender} tokens={tokens} />
          </p>
        )}
      </div>
    </article>
  );
}
