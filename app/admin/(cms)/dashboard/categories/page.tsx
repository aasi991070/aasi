import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategoryTreeView } from "@/components/admin/CategoryTreeView";
import { Button } from "@/components/ui/button";
import { getCategoryTree } from "@/lib/queries/categories";

export default async function AdminCategoriesPage() {
  const categories = await getCategoryTree();

  return (
    <>
      <PageHeader
        surface="admin"
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

      <CategoryTreeView categories={categories} />
    </>
  );
}
