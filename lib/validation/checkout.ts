import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode");

export const checkoutAddressSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  line1: z.string().trim().min(1, "Address line 1 is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  pincode: pincodeSchema,
  country: z.literal("IN"),
  phone: phoneSchema,
});

export const checkoutContactSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  phone: phoneSchema,
});

export const createOrderSchema = z.object({
  contact: checkoutContactSchema,
  shippingAddress: checkoutAddressSchema,
  shippingRateId: z.string().uuid("Choose a delivery method"),
  saveAddress: z.boolean().optional(),
  selectedAddressId: z.string().uuid().optional(),
});

export type CheckoutContactValues = z.infer<typeof checkoutContactSchema>;
export type CheckoutAddressValues = z.infer<typeof checkoutAddressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const CHECKOUT_STORAGE_KEY = "aasi:checkout-form-v1";
