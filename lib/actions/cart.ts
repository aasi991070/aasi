"use server";

import { revalidateTag } from "next/cache";
import { ensureCartIdentity } from "@/lib/cart/identity";
import { CART_TAG } from "@/lib/cart/constants";
import { DataError } from "@/lib/errors";
import {
  addToCartLine,
  applyCartCoupon,
  clearCartLines,
  getCart,
  removeCartCoupon,
  removeCartLine,
  updateCartLineQty,
} from "@/lib/queries/cart";
import {
  addToCartSchema,
  applyCouponSchema,
  cartItemIdSchema,
  updateCartItemQtySchema,
} from "@/lib/validation/cart";
import { formatZodError } from "@/lib/validation/catalog";
import type { CartActionResult, CartError } from "@/types";

function revalidateCart() {
  revalidateTag(CART_TAG);
}

function isCartError(error: unknown): error is CartError {
  return (
    typeof error === "object" &&
    error != null &&
    "code" in error &&
    "message" in error
  );
}

function toCartFailure(error: unknown): CartActionResult {
  if (isCartError(error)) {
    return { ok: false, error };
  }

  if (error instanceof DataError) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: error.message,
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "UNKNOWN",
      message: "Something went wrong with your cart.",
    },
  };
}

async function runCartMutation(
  fn: (
    supabase: Awaited<ReturnType<typeof ensureCartIdentity>>["supabase"],
    sessionId: string,
    user: Awaited<ReturnType<typeof ensureCartIdentity>>["user"]
  ) => Promise<Awaited<ReturnType<typeof getCart>>>
): Promise<CartActionResult> {
  try {
    const { supabase, user, sessionId } = await ensureCartIdentity();
    const cart = await fn(supabase, sessionId, user);
    revalidateCart();
    return { ok: true, cart };
  } catch (error) {
    return toCartFailure(error);
  }
}

export async function addToCart(input: unknown): Promise<CartActionResult> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: formatZodError(parsed.error),
      },
    };
  }

  return runCartMutation((supabase, sessionId, user) =>
    addToCartLine(supabase, sessionId, user, {
      productId: parsed.data.productId,
      variantId: parsed.data.variantId ?? null,
      qty: parsed.data.qty,
    })
  );
}

export async function updateCartItemQty(
  itemId: string,
  qty: number
): Promise<CartActionResult> {
  const parsed = updateCartItemQtySchema.safeParse({ itemId, qty });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: formatZodError(parsed.error),
      },
    };
  }

  return runCartMutation((supabase, sessionId, user) =>
    updateCartLineQty(
      supabase,
      sessionId,
      user,
      parsed.data.itemId,
      parsed.data.qty
    )
  );
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  const parsed = cartItemIdSchema.safeParse({ itemId });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: formatZodError(parsed.error),
      },
    };
  }

  return runCartMutation((supabase, sessionId, user) =>
    removeCartLine(supabase, sessionId, user, parsed.data.itemId)
  );
}

export async function clearCart(): Promise<CartActionResult> {
  return runCartMutation((supabase, sessionId, user) =>
    clearCartLines(supabase, sessionId, user)
  );
}

export async function applyCoupon(code: string): Promise<CartActionResult> {
  const parsed = applyCouponSchema.safeParse({ code });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: formatZodError(parsed.error),
      },
    };
  }

  return runCartMutation((supabase, sessionId, user) =>
    applyCartCoupon(supabase, sessionId, user, parsed.data.code)
  );
}

export async function removeCoupon(): Promise<CartActionResult> {
  return runCartMutation((supabase, sessionId, user) =>
    removeCartCoupon(supabase, sessionId, user)
  );
}

export async function fetchCart(): Promise<CartActionResult> {
  return runCartMutation((supabase, sessionId, user) =>
    getCart(supabase, sessionId, user)
  );
}
