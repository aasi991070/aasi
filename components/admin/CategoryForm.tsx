"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LEVELS } from "@/constants";
import { useUiStore } from "@/hooks/useUiStore";
import { saveCategoryAction } from "@/lib/actions/catalog";
import { slugify } from "@/lib/utils/slugify";
import { categorySchema, type CategoryFormValues } from "@/lib/validation/catalog";
import type { Category } from "@/types";

interface CategoryFormProps {
  existing?: Category;
  categories: Category[];
  defaultParentId?: string;
  defaultLevel?: 1 | 2 | 3 | 4;
}

function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => [c, ...(c.children ? flattenCategories(c.children) : [])]);
}

export function CategoryForm({
  existing,
  categories,
  defaultParentId,
  defaultLevel,
}: CategoryFormProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [isNavigating, startTransition] = useTransition();
  const flat = flattenCategories(categories);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: existing?.name ?? "",
      slug: existing?.slug ?? "",
      description: existing?.description ?? "",
      image_url: existing?.image_url ?? "",
      parent_id: existing?.parent_id ?? defaultParentId ?? "",
      level: existing?.level ?? defaultLevel ?? 1,
      sort_order: existing?.sort_order ?? 0,
      is_active: existing?.is_active ?? true,
    },
  });

  const name = watch("name");

  useEffect(() => {
    if (!existing && name) setValue("slug", slugify(name));
  }, [name, existing, setValue]);

  const onSubmit = async (data: CategoryFormValues) => {
    const result = await saveCategoryAction(data, existing?.id);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    showToast(existing ? "Category updated" : "Category created", "success");

    startTransition(() => {
      router.push("/admin/dashboard/categories");
      router.refresh();
    });
  };

  const busy = isSubmitting || isNavigating;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-6 v18-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-v18-danger">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...register("slug")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...register("description")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="level">Level</Label>
        <select
          id="level"
          {...register("level")}
          className="flex h-10 w-full rounded-[var(--radius-input)] border border-v18-border px-3 text-sm"
        >
          {Object.entries(CATEGORY_LEVELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parent_id">Parent Category</Label>
        <select
          id="parent_id"
          {...register("parent_id")}
          className="flex h-10 w-full rounded-[var(--radius-input)] border border-v18-border px-3 text-sm"
        >
          <option value="">None (root)</option>
          {flat
            .filter((c) => c.id !== existing?.id)
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {"—".repeat(cat.level - 1)} {cat.name}
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort_order">Sort Order</Label>
        <Input id="sort_order" type="number" {...register("sort_order")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input id="image_url" {...register("image_url")} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("is_active")} />
        Active
      </label>

      <Button type="submit" disabled={busy}>
        {busy ? "Saving..." : existing ? "Update Category" : "Create Category"}
      </Button>
    </form>
  );
}
