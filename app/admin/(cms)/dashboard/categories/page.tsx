"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryTreeView } from "@/components/admin/CategoryTreeView";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useCategoryTree } from "@/hooks/useCategories";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategoryTree();

  return (
    <>
      <PageHeader
        as="h1"
        title="Categories"
        subtitle="Manage your 4-level category hierarchy"
        variant="onGradient"
        action={
          <Button asChild className="min-h-11">
            <Link href="/admin/dashboard/categories/new">
              <Plus className="mr-2 size-4" />
              Add Category
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner surface="admin" size="lg" />
        </div>
      ) : (
        <CategoryTreeView categories={categories ?? []} />
      )}
    </>
  );
}
