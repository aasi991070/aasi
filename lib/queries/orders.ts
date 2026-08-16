import type { User } from "@supabase/supabase-js";
import { getCartCouponCode } from "@/lib/cart/session";
import { validateCouponForSubtotal } from "@/lib/cart/coupon";
import { computeCheckoutTotals } from "@/lib/checkout/totals";
import { assertOk, DataError } from "@/lib/errors";
import { getCart } from "@/lib/queries/cart";
import { getShippingRateById } from "@/lib/queries/shipping";
import { getProductImagePaths, resolveImageUrl } from "@/lib/storage/images";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { CreateOrderInput } from "@/lib/validation/checkout";
import type { CheckoutStockIssue, OrderAddressSnapshot, Product } from "@/types";

interface ValidatedCheckoutLine {
  cartItemId: string;
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  sku?: string;
  imageSnapshot?: string;
  size?: string;
  color?: string;
  qty: number;
  unitPrice: number;
  productTaxRate?: number | null;
}

function isMissingOrdersTable(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    Boolean(error.message?.includes("orders"))
  );
}

async function loadProductTaxMeta(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("tax_rate, hsn_code, is_active")
    .eq("id", productId)
    .maybeSingle();

  if (error && !error.message?.includes("tax_rate")) {
    assertOk("orders.productTax", { data, error });
  }

  return data as { tax_rate?: number | null; is_active?: boolean } | null;
}

export async function validateCheckoutCart(
  sessionId: string,
  user: User | null
): Promise<
  | {
      ok: true;
      lines: ValidatedCheckoutLine[];
      couponCode?: string;
    }
  | { ok: false; items: CheckoutStockIssue[]; message: string }
> {
  const supabase = await createClient();
  const cart = await getCart(supabase, sessionId, user);

  if (!cart.items.length) {
    return {
      ok: false,
      items: [],
      message: "Your cart is empty.",
    };
  }

  const issues: CheckoutStockIssue[] = [];
  const lines: ValidatedCheckoutLine[] = [];

  for (const item of cart.items) {
    const product = item.product;
    const name = product?.name ?? "Item";

    if (!product || !product.is_active) {
      issues.push({
        itemId: item.id,
        productName: name,
        reason: "This product is no longer available.",
      });
      continue;
    }

    if (item.qty > item.availableStock) {
      issues.push({
        itemId: item.id,
        productName: name,
        reason:
          item.availableStock <= 0
            ? "This item is now out of stock."
            : `Only ${item.availableStock} left in stock.`,
      });
      continue;
    }

    const taxMeta = await loadProductTaxMeta(item.product_id);

    lines.push({
      cartItemId: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      name: product.name,
      slug: product.slug,
      sku: item.variant?.sku,
      imageSnapshot: getProductImagePaths(product as Product)[0]
        ? resolveImageUrl(getProductImagePaths(product as Product)[0])
        : undefined,
      size: item.variant?.size,
      color: item.variant?.color,
      qty: item.qty,
      unitPrice: item.unit_price_snapshot,
      productTaxRate: taxMeta?.tax_rate ?? null,
    });
  }

  if (issues.length) {
    return {
      ok: false,
      items: issues,
      message: `${issues.length} item${issues.length === 1 ? "" : "s"} changed`,
    };
  }

  const couponCode = await getCartCouponCode();

  return { ok: true, lines, couponCode };
}

export async function createOrderFromCheckout(
  input: CreateOrderInput,
  sessionId: string,
  user: User | null
) {
  const validated = await validateCheckoutCart(sessionId, user);
  if (!validated.ok) {
    return validated;
  }

  const shippingRate = await getShippingRateById(input.shippingRateId);
  if (!shippingRate) {
    return {
      ok: false as const,
      items: [],
      message: "That delivery option is no longer available.",
    };
  }

  let coupon = null;
  const subtotalPreview = validated.lines.reduce(
    (sum, line) => sum + line.unitPrice * line.qty,
    0
  );

  if (validated.couponCode) {
    const couponResult = await validateCouponForSubtotal(
      validated.couponCode,
      subtotalPreview
    );
    if (!couponResult.ok) {
      return {
        ok: false as const,
        items: [],
        message: couponResult.message,
      };
    }
    coupon = couponResult.value.coupon;
  }

  const totals = computeCheckoutTotals(
    validated.lines.map((line) => ({
      id: line.cartItemId,
      productId: line.productId,
      name: line.name,
      qty: line.qty,
      unitPrice: line.unitPrice,
      productTaxRate: line.productTaxRate,
    })),
    shippingRate,
    coupon
  );

  const shippingAddress: OrderAddressSnapshot = {
    name: input.shippingAddress.name,
    line1: input.shippingAddress.line1,
    line2: input.shippingAddress.line2,
    city: input.shippingAddress.city,
    state: input.shippingAddress.state,
    pincode: input.shippingAddress.pincode,
    country: input.shippingAddress.country,
    phone: input.shippingAddress.phone,
  };

  const service = createServiceClient();

  const orderInsert = assertOk(
    "orders.create",
    await service
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        email: input.contact.email,
        phone: input.contact.phone,
        status: "pending",
        payment_status: "unpaid",
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping_fee: totals.shippingFee,
        tax: totals.tax,
        total: totals.total,
        currency: "INR",
        coupon_code: coupon?.code ?? null,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
      })
      .select("id, order_number, total")
      .single()
  );

  if (!orderInsert) {
    throw new DataError("orders.create", "No order returned");
  }

  const orderItems = totals.lines.map((line, index) => {
    const source = validated.lines[index];
    return {
      order_id: orderInsert.id,
      product_id: source.productId,
      variant_id: source.variantId ?? null,
      name_snapshot: source.name,
      slug_snapshot: source.slug,
      sku_snapshot: source.sku ?? null,
      image_snapshot: source.imageSnapshot ?? null,
      size: source.size ?? null,
      color: source.color ?? null,
      qty: source.qty,
      unit_price: source.unitPrice,
      tax_rate: line.taxRate,
      line_total: line.lineTotal,
    };
  });

  try {
    assertOk(
      "orders.items.create",
      await service.from("order_items").insert(orderItems)
    );
  } catch (error) {
    await service.from("orders").delete().eq("id", orderInsert.id);
    throw error;
  }

  // Stock decrement and cart clearing happen on payment confirmation (prompt 26).

  return {
    ok: true as const,
    orderId: String(orderInsert.id),
    orderNumber: String(orderInsert.order_number),
    total: Number(orderInsert.total),
  };
}

export function isOrdersInfrastructureError(error: unknown): boolean {
  if (error instanceof DataError) {
    return isMissingOrdersTable(
      (error.cause as { code?: string; message?: string }) ?? {}
    );
  }
  return false;
}
