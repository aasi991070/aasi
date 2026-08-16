"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import {
  reconcileVariants,
  variantsFromProduct,
  variantsWithStockBeingRemoved,
} from "@/lib/utils/variantMatrix";
import { useUiStore } from "@/hooks/useUiStore";
import { saveProductAction, saveVariantsAction } from "@/lib/actions/catalog";
import { slugify } from "@/lib/utils/slugify";
import { productSchema, type ProductFormValues } from "@/lib/validation/catalog";
import type { Category, Product, VariantFormInput } from "@/types";
import { ImageUploader } from "./ImageUploader";
import { TagInput } from "./TagInput";
import { VariantMatrix } from "./VariantMatrix";

interface ProductFormProps {
  existing?: Product;
  categories: Category[];
}

export function ProductForm({ existing, categories }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [isNavigating, startTransition] = useTransition();
  const [variants, setVariants] = useState<VariantFormInput[]>(() =>
    existing
      ? variantsFromProduct(
          existing.sizes,
          existing.colors,
          existing.slug,
          existing.variants ?? []
        )
      : []
  );

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
    control,
    getValues,
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
      stock_count: existing?.stock_count ?? 0,
      is_featured: existing?.is_featured ?? false,
      is_active: existing?.is_active ?? true,
      tags: existing?.tags ?? [],
      meta_title: existing?.meta_title ?? "",
      meta_description: existing?.meta_description ?? "",
      image_alts: existing?.image_alts ?? [],
    },
  });

  const name = watch("name");
  const slug = watch("slug");
  const categoryId = watch("category_id");
  const gender = watch("gender");
  const sizes = watch("sizes");
  const colors = watch("colors");
  const images = watch("images");
  const imageAlts = watch("image_alts");

  const managesVariants = Boolean(existing && sizes.length && colors.length);
  const variantStockTotal = useMemo(
    () =>
      variants
        .filter((variant) => variant.is_enabled)
        .reduce((sum, variant) => sum + variant.stock_count, 0),
    [variants]
  );

  useEffect(() => {
    if (!existing && name) {
      setValue("slug", slugify(name));
    }
  }, [name, existing, setValue]);

  useEffect(() => {
    if (!categoryId) return;
    const l1 = findLevel1Category(categoryId, flatCategories);
    if (!l1) return;
    const nextGender = genderFromCategorySlug(l1.slug);
    if (nextGender) setValue("gender", nextGender);
  }, [categoryId, flatCategories, setValue]);

  useEffect(() => {
    if (!managesVariants) return;
    setValue("stock_count", variantStockTotal);
  }, [managesVariants, setValue, variantStockTotal]);

  useEffect(() => {
    if (!existing || !sizes.length || !colors.length) {
      setVariants([]);
      return;
    }

    setVariants((current) =>
      reconcileVariants(sizes, colors, existing.slug, current)
    );
  }, [sizes, colors, existing]);

  useEffect(() => {
    const current = getValues("image_alts");
    setValue(
      "image_alts",
      images.map((_, index) => current[index] ?? "")
    );
  }, [images, getValues, setValue]);

  const onSubmit = async (data: ProductFormValues) => {
    const payload = managesVariants
      ? { ...data, stock_count: variantStockTotal }
      : data;

    const result = await saveProductAction(payload, existing?.id);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    if (existing && managesVariants) {
      const variantResult = await saveVariantsAction(result.data.id, variants);
      if (!variantResult.ok) {
        showToast(variantResult.message, "error");
        return;
      }
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

  const applySizeChange = (nextSizes: string[]) => {
    if (existing && colors.length) {
      const removed = variantsWithStockBeingRemoved(variants, nextSizes, colors);
      if (
        removed.length &&
        !window.confirm(
          `Removing sizes will drop ${removed.length} variant(s) with stock. Continue?`
        )
      ) {
        return;
      }
    }

    setValue("sizes", nextSizes);
  };

  const applyColorChange = (nextColors: string[]) => {
    if (existing && sizes.length) {
      const removed = variantsWithStockBeingRemoved(variants, sizes, nextColors);
      if (
        removed.length &&
        !window.confirm(
          `Removing colours will drop ${removed.length} variant(s) with stock. Continue?`
        )
      ) {
        return;
      }
    }

    setValue("colors", nextColors);
  };

  const toggleSize = (size: string) => {
    const nextSizes = sizes.includes(size)
      ? sizes.filter((entry) => entry !== size)
      : [...sizes, size];
    applySizeChange(nextSizes);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6 v18-card p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} className="rounded-[var(--radius-input)]" />
          {errors.name ? (
            <p className="text-xs text-v18-danger">{errors.name.message}</p>
          ) : null}
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
          <Label htmlFor="meta_title">SEO title</Label>
          <Input id="meta_title" {...register("meta_title")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_description">SEO description</Label>
          <Textarea id="meta_description" rows={3} {...register("meta_description")} />
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
          <Input
            id="gender"
            value={gender ?? ""}
            disabled
            readOnly
            className="bg-slate-50"
          />
          <p className="text-xs v18-text-muted">
            Derived from the level-1 category. Change the category to update it.
          </p>
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
          <Label htmlFor="colors">Colours</Label>
          <Controller
            name="colors"
            control={control}
            render={({ field }) => (
              <TagInput
                id="colors"
                value={field.value}
                onChange={applyColorChange}
                placeholder="Add a colour"
                normalize={(color) => color.toLowerCase()}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TagInput
                id="tags"
                value={field.value}
                onChange={field.onChange}
                placeholder="Add a tag"
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="v18-card p-6">
          <Label className="mb-4 block">Images</Label>
          <ImageUploader
            value={images}
            onChange={(paths) => setValue("images", paths)}
            altTexts={imageAlts}
            onAltTextsChange={(alts) => setValue("image_alts", alts)}
          />
        </div>

        {existing && sizes.length && colors.length ? (
          <div className="space-y-4 v18-card p-6">
            <Label className="block">Variant stock</Label>
            <VariantMatrix
              slug={slug || existing.slug}
              sizes={sizes}
              colors={colors}
              value={variants}
              onChange={setVariants}
            />
          </div>
        ) : null}

        <div className="space-y-4 v18-card p-6">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" step="0.01" {...register("price")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sale_price">Sale Price</Label>
            <Input id="sale_price" type="number" step="0.01" {...register("sale_price")} />
            {errors.sale_price ? (
              <p className="text-xs text-v18-danger">{errors.sale_price.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock_count">Stock Count</Label>
            <Input
              id="stock_count"
              type="number"
              readOnly={managesVariants}
              disabled={managesVariants}
              {...register("stock_count")}
              className={managesVariants ? "bg-slate-50" : undefined}
            />
            <p className="text-xs v18-text-muted">
              {managesVariants
                ? "Summed from enabled variants and synced on save."
                : "In-stock status is derived from stock count."}
            </p>
          </div>
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
