import { z } from "zod";

const numericField = z.union([z.number(), z.string()]).transform((value) =>
  Number(value)
);

export const productVariantRowSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  stock_count: numericField.pipe(z.number().int()),
  sku: z.string().nullable().optional(),
  price_override: numericField.nullable().optional(),
  is_enabled: z.boolean().optional(),
  created_at: z.string(),
});

export const productRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  price: numericField,
  sale_price: numericField.nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  gender: z.enum(["men", "women", "unisex"]).nullable().optional(),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  thumbnail_url: z.string().nullable().optional(),
  in_stock: z.boolean(),
  stock_count: numericField.pipe(z.number().int()),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  tags: z.array(z.string()).default([]),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  image_alts: z.array(z.string()).optional(),
  tax_rate: numericField.optional(),
  hsn_code: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  variants: z.array(productVariantRowSchema).optional(),
});

export type ProductRow = z.infer<typeof productRowSchema>;

export function parseProductRow(row: unknown): ProductRow {
  return productRowSchema.parse(row);
}
