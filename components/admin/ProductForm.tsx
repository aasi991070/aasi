"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GENDERS, SIZES } from "@/constants";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useUiStore } from "@/hooks/useUiStore";
import { slugify } from "@/lib/utils/slugify";
import type { Category, Product } from "@/types";
import { ImageUploader } from "./ImageUploader";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  sale_price: z.coerce.number().optional(),
  category_id: z.string().optional(),
  gender: z.enum(["men", "women", "unisex"]).optional(),
  sizes: z.array(z.string()),
  colors: z.array(z.string()),
  images: z.array(z.string()),
  thumbnail_url: z.string().optional(),
  in_stock: z.boolean(),
  stock_count: z.coerce.number().min(0),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  tags: z.array(z.string()),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  existing?: Product;
  categories: Category[];
}

export function ProductForm({ existing, categories }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

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
  const sizes = watch("sizes");
  const images = watch("images");

  useEffect(() => {
    if (!existing && name) {
      setValue("slug", slugify(name));
    }
  }, [name, existing, setValue]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const payload = {
        ...data,
        thumbnail_url: data.images[0] ?? data.thumbnail_url,
        sale_price: data.sale_price || undefined,
        category_id: data.category_id || undefined,
      };

      if (existing) {
        await updateProduct.mutateAsync({ id: existing.id, data: payload });
        showToast("Product updated successfully", "success");
      } else {
        await createProduct.mutateAsync(payload);
        showToast("Product created successfully", "success");
      }

      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: ["/", "/product", "/category"] }),
      });

      router.push("/admin/dashboard/products");
      router.refresh();
    } catch {
      showToast("Failed to save product", "error");
    }
  };

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
          <Textarea id="description" rows={5} {...register("description")} />
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

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            {...register("gender")}
            className="flex h-10 w-full rounded-[var(--radius-input)] border border-v18-border bg-white px-3 text-sm"
          >
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

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
                    ? "border-v18-primary bg-blue-50 text-v18-primary"
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

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-11"
        >
          {isSubmitting ? "Saving..." : existing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
