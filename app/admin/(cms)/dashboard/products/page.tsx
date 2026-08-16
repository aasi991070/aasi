import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductTable } from "@/components/admin/ProductTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProducts } from "@/lib/queries/products";

const PAGE_SIZE = 20;

function buildProductsQuery(params: { search?: string; page?: number }) {
  const next = new URLSearchParams();
  if (params.search) next.set("search", params.search);
  if (params.page && params.page > 1) next.set("page", String(params.page));
  const query = next.toString();
  return query ? `?${query}` : "";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const { products, total } = await getProducts({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        surface="admin"
        as="h1"
        title="Products"
        subtitle="Manage your product catalog"
        variant="onGradient"
        action={
          <Button asChild className="min-h-11">
            <Link href="/admin/dashboard/products/new">
              <Plus className="mr-2 size-4" />
              Add Product
            </Link>
          </Button>
        }
      />

      <form method="get" className="mb-6">
        <Input
          name="search"
          placeholder="Search products..."
          defaultValue={search}
          className="max-w-sm bg-white"
        />
      </form>

      {products.length ? (
        <>
          <ProductTable products={products} />
          {totalPages > 1 ? (
            <nav
              aria-label="Products pagination"
              className="mt-6 flex justify-center gap-2"
            >
              {page > 1 ? (
                <Button asChild variant="outline">
                  <Link
                    href={buildProductsQuery({ search, page: page - 1 })}
                    scroll={false}
                  >
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Previous
                </Button>
              )}
              <span className="flex items-center px-4 text-sm text-white">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Button asChild variant="outline">
                  <Link
                    href={buildProductsQuery({ search, page: page + 1 })}
                    scroll={false}
                  >
                    Next
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Next
                </Button>
              )}
            </nav>
          ) : null}
        </>
      ) : (
        <EmptyState
          surface="admin"
          title="No products found"
          description="Get started by adding your first product."
          actionLabel="Add Product"
          actionHref="/admin/dashboard/products/new"
        />
      )}
    </>
  );
}
