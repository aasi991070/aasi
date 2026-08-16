import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategoryTree } from "@/lib/queries/categories";
import { getProductById } from "@/lib/queries/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategoryTree(),
  ]);

  if (!product) notFound();

  return (
    <>
      <PageHeader
        surface="admin"
        as="h1"
        title="Edit Product"
        subtitle={product.name}
        variant="onGradient"
        action={
          <Link
            href="/admin/dashboard/products"
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to products
          </Link>
        }
      />
      <ProductForm existing={product} categories={categories} />
    </>
  );
}
