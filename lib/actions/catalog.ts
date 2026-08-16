"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { DataError } from "@/lib/errors";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  reorderCategories,
  updateCategory,
} from "@/lib/queries/categories";
import {
  createProduct,
  deleteProduct,
  getProductById,
  saveProductVariants,
  updateProduct,
} from "@/lib/queries/products";
import {
  categorySchema,
  formatZodError,
  productSchema,
  variantsSchema,
  type ActionResult,
} from "@/lib/validation/catalog";
import type { CategoryFormData, Gender, ProductFormData } from "@/types";

/**
 * Every storefront surface that can show a product.
 *
 * `/category/[...slug]` has to be revalidated as a route pattern rather than a
 * concrete path: a product can appear under any of its category's ancestors,
 * and we do not know which pages have been rendered.
 */
function revalidateProduct(slugs: string[]) {
  revalidateTag("products");
  for (const slug of slugs) {
    revalidateTag(`product:${slug}`);
    revalidatePath(`/product/${slug}`);
  }
  revalidatePath("/");
  revalidatePath("/category/[...slug]", "page");
}

/**
 * The query layer throws `DataError` rather than returning null now, so the
 * admin can be told what actually went wrong. This is an admin-only surface,
 * so the underlying database message is useful rather than a leak; anything
 * unrecognised gets a generic message.
 */
function failureMessage(error: unknown, fallback: string): string {
  if (error instanceof DataError) return `${fallback} ${error.message}`;
  return fallback;
}

function revalidateCategory() {
  revalidateTag("categories");
  // A category edit changes names and visibility inside product payloads too.
  revalidateTag("products");
  revalidatePath("/");
  revalidatePath("/category/[...slug]", "page");
}

export async function saveProductAction(
  input: unknown,
  id?: string
): Promise<ActionResult<{ id: string; slug: string }>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: formatZodError(parsed.error) };
  }

  const values = parsed.data;
  const data: ProductFormData = {
    ...values,
    gender: values.gender as Gender | undefined,
    thumbnail_url: values.images[0] ?? values.thumbnail_url,
    sale_price: values.sale_price || undefined,
    category_id: values.category_id || undefined,
    colors: values.colors.map((color) => color.toLowerCase()),
    meta_title: values.meta_title?.trim() || undefined,
    meta_description: values.meta_description?.trim() || undefined,
    image_alts: values.image_alts,
  };

  try {
    // Capture the old slug before updating. Renaming a product would otherwise
    // leave the old PDP serving stale cached content under its previous tag.
    const previousSlug = id ? (await getProductById(id))?.slug : undefined;

    const saved = id ? await updateProduct(id, data) : await createProduct(data);

    const slugs = [saved.slug];
    if (previousSlug && previousSlug !== saved.slug) slugs.push(previousSlug);
    revalidateProduct(slugs);

    return { ok: true, data: { id: saved.id, slug: saved.slug } };
  } catch (error) {
    return {
      ok: false,
      message: failureMessage(
        error,
        id
          ? "Could not update the product. Your changes were not saved."
          : "Could not create the product. Your changes were not saved."
      ),
    };
  }
}

export async function saveVariantsAction(
  productId: string,
  input: unknown
): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  const parsed = variantsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: formatZodError(parsed.error) };
  }

  try {
    const product = await getProductById(productId);
    if (!product) {
      return { ok: false, message: "That product no longer exists." };
    }

    await saveProductVariants(productId, parsed.data);
    revalidateProduct([product.slug]);

    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      message: failureMessage(error, "Could not save product variants."),
    };
  }
}

export async function deleteProductAction(
  id: string
): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  try {
    const existing = await getProductById(id);
    await deleteProduct(id);

    revalidateProduct(existing?.slug ? [existing.slug] : []);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      message: failureMessage(error, "Could not delete the product."),
    };
  }
}

export async function saveCategoryAction(
  input: unknown,
  id?: string
): Promise<ActionResult<{ id: string; slug: string }>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: formatZodError(parsed.error) };
  }

  const values = parsed.data;
  const data: CategoryFormData = {
    ...values,
    level: values.level as 1 | 2 | 3 | 4,
    parent_id: values.parent_id || undefined,
  };

  if (id && data.parent_id === id) {
    return { ok: false, message: "A category cannot be its own parent." };
  }

  try {
    const saved = id
      ? await updateCategory(id, data)
      : await createCategory(data);

    revalidateCategory();
    return { ok: true, data: { id: saved.id, slug: saved.slug } };
  } catch (error) {
    return {
      ok: false,
      message: failureMessage(
        error,
        id
          ? "Could not update the category. Your changes were not saved."
          : "Could not create the category. Your changes were not saved."
      ),
    };
  }
}

export async function deleteCategoryAction(
  id: string
): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  try {
    const existing = await getCategoryById(id);
    if (!existing) {
      return { ok: false, message: "That category no longer exists." };
    }

    await deleteCategory(id);

    revalidateCategory();
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      message: failureMessage(error, "Could not delete the category."),
    };
  }
}

export async function reorderCategoriesAction(
  items: { id: string; sort_order: number }[]
): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  if (!items.length) {
    return { ok: true, data: undefined };
  }

  try {
    await reorderCategories(items);
    revalidateCategory();
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      message: failureMessage(error, "Could not update category order."),
    };
  }
}
