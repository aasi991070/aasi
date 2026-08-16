import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getCategoryById, getCategoryTree } from "@/lib/queries/categories";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, categories] = await Promise.all([
    getCategoryById(id),
    getCategoryTree(),
  ]);

  if (!category) notFound();

  return (
    <>
      <PageHeader
        as="h1"
        title="Edit Category"
        subtitle={category.name}
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
      <CategoryForm existing={category} categories={categories} />
    </>
  );
}
