"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SIZES } from "@/constants";
import {
  findLevel1Category,
  genderFromCategorySlug,
} from "@/lib/utils/getGenderCategory";
import { useUiStore } from "@/hooks/useUiStore";
import { saveProductAction } from "@/lib/actions/catalog";
import { slugify } from "@/lib/utils/slugify";
import { productSchema, type ProductFormValues } from "@/lib/validation/catalog";
import type { Category, Product } from "@/types";
import { ImageUploader } from "./ImageUploader";

interface ProductFormProps {
  existing?: Product;
  categories: Category[];
}

export function ProductForm({ existing, categories }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [isNavigating, startTransition] = useTransition();

  const flatCategories = useMemo(() => {
    const flatten = (cats: Category[]): Category[] =>
      cats.flatMap((c) => [c, ...(c.children ? flatten(c.children) : [])]);
    return flatten(categories);
  }, [categories]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: existing?.name ?? "",
      slug: existing?.slug ?? "",
      description: existing?.description ?? "",
      price: existing?.price ?? 0,
      sale_price: existing?.sale_price,
      category_id: existing?.category_id ?? "",
      gender: existing?.gender,
      sizes: existing?.sizes ?? [],
      colors: existing?.colors ?? [],
      images: existing?.images ?? [],
      thumbnail_url: existing?.thumbnail_url ?? "",
      in_stock: existing?.in_stock ?? true,
      stock_count: existing?.stock_count ?? 0,
      is_featured: existing?.is_featured ?? false,
      is_active: existing?.is_active ?? true,
      tags: existing?.tags ?? [],
    },
  });

  const name = watch("name");
  const categoryId = watch("category_id");
  const sizes = watch("sizes");
  const images = watch("images");

  useEffect(() => {
    if (!existing && name) {
      setValue("slug", slugify(name));
    }
  }, [name, existing, setValue]);

  useEffect(() => {
    if (!categoryId) return;
    const l1 = findLevel1Category(categoryId, flatCategories);
    if (!l1) return;
    const gender = genderFromCategorySlug(l1.slug);
    if (gender) setValue("gender", gender);
  }, [categoryId, flatCategories, setValue]);

  // The action re-checks admin authorisation, re-validates, writes, and
  // invalidates the affected cache tags server-side. The old code posted to
  // /api/revalidate from here without the secret header, so the request 401'd
  // and the failure was never surfaced.
  const onSubmit = async (data: ProductFormValues) => {
    const result = await saveProductAction(data, existing?.id);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    showToast(
      existing ? "Product updated successfully" : "Product created successfully",
      "success"
    );

    startTransition(() => {
      router.push("/admin/dashboard/products");
      router.refresh();
    });
  };

  const busy = isSubmitting || isNavigating;

  const toggleSize = (size: string) => {
    setValue(
      "sizes",
      sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size]
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6 v18-card p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} className="rounded-[var(--radius-input)]" />
          {errors.name && <p className="text-xs text-v18-danger">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register("slug")} className="rounded-[var(--radius-input)]" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={6} {...register("description")} />
          <p className="text-xs v18-text-muted">
            Use a blank line between paragraphs.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Category</Label>
          <select
            id="category_id"
            {...register("category_id")}
            className="flex h-10 w-full rounded-[var(--radius-input)] border border-v18-border bg-white px-3 text-sm"
          >
            <option value="">Select category</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {"—".repeat(cat.level - 1)} {cat.name} (L{cat.level})
              </option>
            ))}
          </select>
        </div>

        <input type="hidden" {...register("gender")} />

        <div className="space-y-2">
          <Label>Sizes</Label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  sizes.includes(size)
                    ? "v18-chip-selected"
                    : "border-v18-border v18-text-muted"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="colors">Colors (comma-separated)</Label>
          <Input
            id="colors"
            defaultValue={existing?.colors.join(", ") ?? ""}
            onChange={(e) =>
              setValue(
                "colors",
                e.target.value
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            defaultValue={existing?.tags.join(", ") ?? ""}
            onChange={(e) =>
              setValue(
                "tags",
                e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="v18-card p-6">
          <Label className="mb-4 block">Images</Label>
          <ImageUploader value={images} onChange={(paths) => setValue("images", paths)} />
        </div>

        <div className="space-y-4 v18-card p-6">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" step="0.01" {...register("price")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sale_price">Sale Price</Label>
            <Input id="sale_price" type="number" step="0.01" {...register("sale_price")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock_count">Stock Count</Label>
            <Input id="stock_count" type="number" {...register("stock_count")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("in_stock")} />
            In stock
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("is_featured")} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("is_active")} />
            Active
          </label>
        </div>

        <Button type="submit" disabled={busy} className="w-full min-h-11">
          {busy ? "Saving..." : existing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
