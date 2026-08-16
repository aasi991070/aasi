import { z } from "zod";

export const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(254, "Email is too long"),
});

export type SubscribeFormState =
  | { ok: true; message: string }
  | { ok: false; message: string };

export const SUBSCRIBE_INITIAL_STATE: SubscribeFormState = {
  ok: false,
  message: "",
};
