import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchResultCard } from "@/components/storefront/SearchResultCard";
import { StorefrontSearch } from "@/components/storefront/StorefrontSearch";
import { HighlightText } from "@/lib/utils/highlightText";
import { tokenizeQuery } from "@/lib/utils/searchText";
import { getAllCategories } from "@/lib/queries/categories";
import { searchCategories, searchProducts } from "@/lib/queries/search";

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
    <>
      <PageHeader
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
        <div className="v18-card py-16 text-center">
          <p className="text-sm v18-text-muted">Enter a search term above.</p>
        </div>
      )}

      {query && !hasResults && (
        <div className="v18-card py-16 text-center">
          <p className="text-sm v18-text-muted">
            No products or categories match &quot;{query}&quot;.
          </p>
        </div>
      )}

      {categoryResults.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold v18-text-on-gradient">
            Categories
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {categoryResults.map(({ category, href }) => (
              <li key={category.id}>
                <Link
                  href={href}
                  className="v18-card block p-4 transition-shadow hover:shadow-lg"
                >
                  <p className="font-medium v18-text-heading">
                    <HighlightText text={category.name} tokens={tokens} />
                  </p>
                  {category.description && (
                    <p className="mt-1 text-sm v18-text-muted line-clamp-2">
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
          <h2 className="mb-4 text-lg font-semibold v18-text-on-gradient">
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
    </>
  );
}
