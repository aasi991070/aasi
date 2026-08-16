import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchResultCard } from "@/components/storefront/SearchResultCard";
import { StorefrontSearch } from "@/components/storefront/StorefrontSearch";
import { HighlightText } from "@/lib/utils/highlightText";
import { tokenizeQuery } from "@/lib/utils/searchText";
import { getAllCategories } from "@/lib/queries/categories";
import { searchCategories, searchProducts } from "@/lib/queries/search";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q = "" } = await searchParams;
  const query = q.trim();

  if (query) {
    return {
      title: `Results for "${query}"`,
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return {
    title: "Search",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const tokens = tokenizeQuery(query);

  const [productResults, categoryResults, allCategories] = await Promise.all([
    query ? searchProducts(query) : Promise.resolve([]),
    query ? searchCategories(query) : Promise.resolve([]),
    getAllCategories(true),
  ]);

  const hasResults =
    productResults.length > 0 || categoryResults.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <PageHeader
        as="h1"
        title={query ? `Results for "${query}"` : "Search"}
        subtitle={
          query
            ? `${productResults.length} product${productResults.length === 1 ? "" : "s"}, ${categoryResults.length} categor${categoryResults.length === 1 ? "y" : "ies"}`
            : "Search the full catalog"
        }
        action={
          <Suspense fallback={null}>
            <StorefrontSearch />
          </Suspense>
        }
      />

      {!query && (
        <div className="store-hairline bg-store-white py-16 text-center">
          <p className="text-sm text-store-ink-muted">
            Enter a search term above.
          </p>
        </div>
      )}

      {query && !hasResults && (
        <div className="store-hairline bg-store-white py-16 text-center">
          <p className="text-sm text-store-ink-muted">
            No products or categories match &quot;{query}&quot;.
          </p>
        </div>
      )}

      {categoryResults.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 font-display text-2xl font-normal text-store-ink">
            Categories
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {categoryResults.map(({ category, href }) => (
              <li key={category.id}>
                <Link
                  href={href}
                  className="store-hairline block bg-store-white p-4 transition-colors hover:border-store-accent"
                >
                  <p className="font-medium text-store-ink">
                    <HighlightText text={category.name} tokens={tokens} />
                  </p>
                  {category.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-store-ink-muted">
                      <HighlightText
                        text={category.description}
                        tokens={tokens}
                      />
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {productResults.length > 0 && (
        <section>
          <h2 className="mb-6 font-display text-2xl font-normal text-store-ink">
            Products
          </h2>
          <div className="space-y-4">
            {productResults.map(({ product, matchedFields }) => (
              <SearchResultCard
                key={product.id}
                product={product}
                matchedFields={matchedFields}
                query={query}
                allCategories={allCategories}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
