import { z } from "zod";

/**
 * Shared by the admin forms and the server actions. The forms use these for
 * inline feedback; the actions re-validate with the same rules, because a
 * server action is a public HTTP endpoint and client-side validation is a
 * convenience, not a control.
 */

export const productSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    sale_price: z.preprocess(
      (val) =>
        val === "" || val == null || (typeof val === "number" && Number.isNaN(val))
          ? undefined
          : val,
      z.coerce.number().min(0).optional()
    ),
    category_id: z.string().optional(),
    gender: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.enum(["men", "women", "unisex"]).optional()
    ),
    sizes: z.array(z.string()),
    colors: z.array(z.string()),
    images: z.array(z.string()),
    thumbnail_url: z.string().optional(),
    stock_count: z.coerce.number().min(0),
    is_featured: z.boolean(),
    is_active: z.boolean(),
    tags: z.array(z.string()),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    image_alts: z.array(z.string()),
  })
  .refine(
    (data) =>
      data.sale_price == null || data.sale_price === undefined || data.sale_price < data.price,
    {
      message: "Sale price must be less than the regular price",
      path: ["sale_price"],
    }
  );

export const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().min(1),
  color: z.string().min(1),
  stock_count: z.coerce.number().min(0),
  sku: z.string().optional(),
  price_override: z.preprocess(
    (val) =>
      val === "" || val == null || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : val,
    z.coerce.number().min(0).optional().nullable()
  ),
  is_enabled: z.boolean(),
});

export const variantsSchema = z.array(variantInputSchema);

export type ProductFormValues = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  image_url: z.string().optional(),
  parent_id: z.string().optional(),
  level: z.coerce.number().min(1).max(4),
  sort_order: z.coerce.number().min(0),
  is_active: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

/** Discriminated result so callers get a message instead of a thrown string. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/** Flattens a ZodError into one readable sentence for a toast. */
export function formatZodError(error: z.ZodError): string {
  const first = error.errors[0];
  if (!first) return "Please check the form and try again.";

  const field = first.path.join(".");
  return field ? `${field}: ${first.message}` : first.message;
}
