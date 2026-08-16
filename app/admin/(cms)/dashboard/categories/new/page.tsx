import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getCategoryTree } from "@/lib/queries/categories";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string; level?: string }>;
}) {
  const params = await searchParams;
  const categories = await getCategoryTree();
  const defaultLevel = params.level
    ? (Number(params.level) as 1 | 2 | 3 | 4)
    : undefined;

  return (
    <>
      <PageHeader
        as="h1"
        title="Add Category"
        subtitle="Create a new category"
        variant="onGradient"
        action={
          <Link
            href="/admin/dashboard/categories"
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to categories
          </Link>
        }
      />
      <CategoryForm
        categories={categories}
        defaultParentId={params.parent}
        defaultLevel={defaultLevel}
      />
    </>
  );
}
