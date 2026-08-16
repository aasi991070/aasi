"use server";

import { ensureCartIdentity, isSignedInCustomer } from "@/lib/cart/identity";
import {
  createOrderFromCheckout,
  isOrdersInfrastructureError,
} from "@/lib/queries/orders";
import { saveUserAddress } from "@/lib/queries/addresses";
import { createOrderSchema } from "@/lib/validation/checkout";
import { formatZodError } from "@/lib/validation/catalog";
import type { CheckoutActionResult } from "@/types";

export async function createOrderAction(
  input: unknown
): Promise<CheckoutActionResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: formatZodError(parsed.error),
      },
    };
  }

  try {
    const { supabase, user, sessionId } = await ensureCartIdentity();
    void supabase;

    const result = await createOrderFromCheckout(
      parsed.data,
      sessionId,
      user
    );

    if (!result.ok) {
      if ("items" in result && result.items.length) {
        return {
          ok: false,
          error: {
            code: "STOCK_CHANGED",
            message: result.message,
            items: result.items,
          },
        };
      }

      const message = result.message.toLowerCase();

      return {
        ok: false,
        error: {
          code: message.includes("empty")
            ? "EMPTY_CART"
            : message.includes("coupon")
              ? "INVALID_COUPON"
              : "UNKNOWN",
          message: result.message,
        },
      };
    }

    if (
      parsed.data.saveAddress &&
      user &&
      isSignedInCustomer(user) &&
      !parsed.data.selectedAddressId
    ) {
      await saveUserAddress(user.id, parsed.data.shippingAddress);
    }

    return {
      ok: true,
      data: {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total: result.total,
      },
    };
  } catch (error) {
    if (isOrdersInfrastructureError(error)) {
      return {
        ok: false,
        error: {
          code: "UNKNOWN",
          message:
            "Checkout is not available yet — commerce migrations have not been applied.",
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Could not place your order. Please try again.",
      },
    };
  }
}
