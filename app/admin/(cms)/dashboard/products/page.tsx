"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductTable } from "@/components/admin/ProductTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteProduct, useProducts } from "@/hooks/useProducts";
import { useUiStore } from "@/hooks/useUiStore";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { showToast } = useUiStore();
  const deleteProduct = useDeleteProduct();
  const { data, isLoading } = useProducts({ search, page, pageSize: 20 });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      showToast("Product deleted", "success");
    } catch {
      showToast("Failed to delete product", "error");
    }
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <>
      <PageHeader
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

      <div className="mb-6">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm bg-white"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : data?.products.length ? (
        <>
          <ProductTable products={data.products} onDelete={handleDelete} />
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-white">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
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
