import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategoryTree } from "@/lib/queries/categories";

export default async function NewProductPage() {
  const categories = await getCategoryTree();

  return (
    <>
      <PageHeader
        as="h1"
        title="Add Product"
        subtitle="Create a new product listing"
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
      <ProductForm categories={categories} />
    </>
  );
}
