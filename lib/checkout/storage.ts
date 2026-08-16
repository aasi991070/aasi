import {
  CHECKOUT_STORAGE_KEY,
  type CreateOrderInput,
} from "@/lib/validation/checkout";

export function loadCheckoutDraft(): Partial<CreateOrderInput> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<CreateOrderInput>;
  } catch {
    return null;
  }
}

export function saveCheckoutDraft(values: CreateOrderInput): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      CHECKOUT_STORAGE_KEY,
      JSON.stringify(values)
    );
  } catch {
    // Ignore quota or privacy mode failures.
  }
}

export function clearCheckoutDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
