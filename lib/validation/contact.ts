import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(254, "Email is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(4000, "Message is too long"),
});

export type ContactFormState =
  | { ok: true; message: string }
  | { ok: false; message: string };

export const CONTACT_INITIAL_STATE: ContactFormState = {
  ok: false,
  message: "",
};
