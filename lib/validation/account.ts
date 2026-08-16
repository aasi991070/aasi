import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .or(z.literal("")),
  marketingOptIn: z.boolean(),
});

export const addressFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  line1: z.string().trim().min(1, "Address line 1 is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  country: z.literal("IN"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export const orderLookupSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required"),
  email: z.string().trim().email("Enter a valid email address"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type AddressFormValues = z.infer<typeof addressFormSchema>;
export type OrderLookupValues = z.infer<typeof orderLookupSchema>;
