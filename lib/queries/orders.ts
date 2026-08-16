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
import type { CheckoutStockIssue, Order, OrderAddressSnapshot, OrderItem, OrderPaymentStatus, OrderStatus, Product } from "@/types";

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

function mapOrderRow(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    order_number: String(row.order_number),
    user_id: row.user_id != null ? String(row.user_id) : null,
    email: String(row.email),
    phone: row.phone != null ? String(row.phone) : undefined,
    status: row.status as OrderStatus,
    payment_status: row.payment_status as OrderPaymentStatus,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    shipping_fee: Number(row.shipping_fee),
    tax: Number(row.tax),
    total: Number(row.total),
    currency: String(row.currency),
    coupon_code: row.coupon_code != null ? String(row.coupon_code) : null,
    shipping_address: row.shipping_address as OrderAddressSnapshot,
    billing_address:
      row.billing_address != null
        ? (row.billing_address as OrderAddressSnapshot)
        : null,
    notes: row.notes != null ? String(row.notes) : undefined,
    placed_at: row.placed_at != null ? String(row.placed_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getOrderById(orderId: string) {
  const service = createServiceClient();
  const row = assertOk(
    "orders.byId",
    await service.from("orders").select("*").eq("id", orderId).maybeSingle()
  );

  return row ? mapOrderRow(row) : null;
}

export async function getOrderByNumber(orderNumber: string) {
  const service = createServiceClient();
  const row = assertOk(
    "orders.byNumber",
    await service
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle()
  );

  return row ? mapOrderRow(row) : null;
}

export async function getOrderItems(orderId: string) {
  const service = createServiceClient();
  const rows = assertOk(
    "orders.items",
    await service.from("order_items").select("*").eq("order_id", orderId)
  );

  return (rows ?? []).map(
    (row): OrderItem => ({
    id: String(row.id),
    order_id: String(row.order_id),
    product_id: row.product_id != null ? String(row.product_id) : null,
    variant_id: row.variant_id != null ? String(row.variant_id) : null,
    name_snapshot: String(row.name_snapshot),
    slug_snapshot: String(row.slug_snapshot),
    sku_snapshot: row.sku_snapshot != null ? String(row.sku_snapshot) : undefined,
    image_snapshot:
      row.image_snapshot != null ? String(row.image_snapshot) : undefined,
    size: row.size != null ? String(row.size) : undefined,
    color: row.color != null ? String(row.color) : undefined,
    qty: Number(row.qty),
    unit_price: Number(row.unit_price),
    tax_rate: Number(row.tax_rate),
    line_total: Number(row.line_total),
    created_at: String(row.created_at),
    })
  );
}

const CUSTOMER_ORDERS_PAGE_SIZE = 10;

export async function getCustomerOrders(page = 1) {
  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * CUSTOMER_ORDERS_PAGE_SIZE;
  const to = from + CUSTOMER_ORDERS_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    assertOk("orders.customerList", { data: null, error });
  }

  return {
    orders: (data ?? []).map((row) => mapOrderRow(row as Record<string, unknown>)),
    total: count ?? 0,
    page: safePage,
    pageSize: CUSTOMER_ORDERS_PAGE_SIZE,
  };
}

export async function getCustomerOrderByNumber(orderNumber: string) {
  const supabase = await createClient();
  const row = assertOk(
    "orders.customerByNumber",
    await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle()
  );

  return row ? mapOrderRow(row) : null;
}

export async function getCustomerOrderItems(orderId: string) {
  const supabase = await createClient();
  const rows = assertOk(
    "orders.customerItems",
    await supabase.from("order_items").select("*").eq("order_id", orderId)
  );

  return (rows ?? []).map(
    (row): OrderItem => ({
      id: String(row.id),
      order_id: String(row.order_id),
      product_id: row.product_id != null ? String(row.product_id) : null,
      variant_id: row.variant_id != null ? String(row.variant_id) : null,
      name_snapshot: String(row.name_snapshot),
      slug_snapshot: String(row.slug_snapshot),
      sku_snapshot:
        row.sku_snapshot != null ? String(row.sku_snapshot) : undefined,
      image_snapshot:
        row.image_snapshot != null ? String(row.image_snapshot) : undefined,
      size: row.size != null ? String(row.size) : undefined,
      color: row.color != null ? String(row.color) : undefined,
      qty: Number(row.qty),
      unit_price: Number(row.unit_price),
      tax_rate: Number(row.tax_rate),
      line_total: Number(row.line_total),
      created_at: String(row.created_at),
    })
  );
}

export async function countCustomerOrders() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  if (error) {
    if (error.code === "PGRST205") {
      return 0;
    }
    assertOk("orders.customerCount", { data: null, error });
  }

  return count ?? 0;
}

