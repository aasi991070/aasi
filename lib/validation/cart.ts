import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  qty: z.coerce.number().int().min(1),
});

export const updateCartItemQtySchema = z.object({
  itemId: z.string().uuid(),
  qty: z.coerce.number().int().min(1),
});

export const cartItemIdSchema = z.object({
  itemId: z.string().uuid(),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemQtyInput = z.infer<typeof updateCartItemQtySchema>;
