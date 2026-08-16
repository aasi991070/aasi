import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSignedInCustomer } from "@/lib/cart/identity";
import {
  computeCouponDiscount,
  validateCouponForSubtotal,
} from "@/lib/cart/coupon";
import {
  MAX_CART_LINE_QTY,
  MAX_CART_LINES,
} from "@/lib/cart/constants";
import { getCartCouponCode, setCartCouponCode } from "@/lib/cart/session";
import { assertOk, DataError } from "@/lib/errors";
import { mapProductRow } from "@/lib/queries/products";
import type {
  Cart,
  CartError,
  CartItemView,
  CartSummary,
  Coupon,
  ProductVariant,
} from "@/types";

type DbClient = SupabaseClient;

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price?: number | null;
  effective_price?: number | null;
  is_active: boolean;
  stock_count: number;
  images?: string[];
  thumbnail_url?: string | null;
}

interface VariantRow {
  id: string;
  product_id: string;
  size?: string | null;
  color?: string | null;
  stock_count: number;
  is_enabled?: boolean | null;
  price_override?: number | null;
}

function isMissingCartTable(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("carts") ||
    error.message?.includes("cart_items")
  );
}

function emptyCartSummary(sessionId: string, messages: string[] = []): CartSummary {
  const now = new Date().toISOString();
  return {
    id: "",
    session_id: sessionId,
    user_id: null,
    status: "active",
    currency: "INR",
    created_at: now,
    updated_at: now,
    items: [],
    subtotal: 0,
    discount: 0,
    itemCount: 0,
    couponCode: null,
    messages,
  };
}

function effectivePrice(row: ProductRow): number {
  if (row.effective_price != null) return Number(row.effective_price);
  if (row.sale_price != null) return Number(row.sale_price);
  return Number(row.price);
}

function mapVariantRow(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    product_id: row.product_id,
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    stock_count: Number(row.stock_count ?? 0),
    is_enabled: row.is_enabled !== false,
    price_override:
      row.price_override != null ? Number(row.price_override) : undefined,
    created_at: "",
  };
}

async function loadProduct(
  supabase: DbClient,
  productId: string
): Promise<
  | { ok: true; product: ProductRow }
  | { ok: false; error: CartError }
> {
  const data = assertOk(
    "cart.product",
    await supabase
      .from("products")
      .select(
        "id, name, slug, price, sale_price, effective_price, is_active, stock_count, images, thumbnail_url"
      )
      .eq("id", productId)
      .maybeSingle()
  );

  if (!data) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "That product no longer exists." },
    };
  }

  if (!data.is_active) {
    return {
      ok: false,
      error: {
        code: "PRODUCT_INACTIVE",
        message: "That product is no longer available.",
      },
    };
  }

  return { ok: true, product: data as ProductRow };
}

async function loadVariant(
  supabase: DbClient,
  productId: string,
  variantId?: string | null
): Promise<
  | { ok: true; variant?: ProductVariant; availableStock: number }
  | { ok: false; error: CartError }
> {
  if (!variantId) {
    const product = await loadProduct(supabase, productId);
    if (!product.ok) return product;
    return {
      ok: true,
      availableStock: Number(product.product.stock_count ?? 0),
    };
  }

  const data = assertOk(
    "cart.variant",
    await supabase
      .from("product_variants")
      .select("id, product_id, size, color, stock_count, is_enabled, price_override")
      .eq("id", variantId)
      .maybeSingle()
  );

  if (!data || data.product_id !== productId) {
    return {
      ok: false,
      error: {
        code: "VARIANT_MISMATCH",
        message: "That size or colour is not available for this product.",
      },
    };
  }

  const variant = mapVariantRow(data as VariantRow);
  if (!variant.is_enabled) {
    return {
      ok: false,
      error: {
        code: "OUT_OF_STOCK",
        message: "That variant is out of stock.",
      },
    };
  }

  return {
    ok: true,
    variant,
    availableStock: variant.stock_count,
  };
}

async function findActiveCartByUserId(
  supabase: DbClient,
  userId: string
): Promise<Cart | null> {
  const data = assertOk(
    "cart.byUser",
    await supabase
      .from("carts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()
  );

  return data ? (data as Cart) : null;
}

async function findActiveGuestCartBySession(
  supabase: DbClient,
  sessionId: string
): Promise<Cart | null> {
  const data = assertOk(
    "cart.bySession",
    await supabase
      .from("carts")
      .select("*")
      .eq("session_id", sessionId)
      .eq("status", "active")
      .is("user_id", null)
      .maybeSingle()
  );

  return data ? (data as Cart) : null;
}

async function createCart(
  supabase: DbClient,
  sessionId: string,
  userId?: string | null
): Promise<Cart> {
  const created = assertOk(
    "cart.create",
    await supabase
      .from("carts")
      .insert({
        session_id: sessionId,
        user_id: userId ?? null,
        status: "active",
        currency: "INR",
      })
      .select("*")
      .single()
  );

  return created as Cart;
}

async function findExistingLine(
  supabase: DbClient,
  cartId: string,
  productId: string,
  variantId?: string | null
) {
  let query = supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .eq("product_id", productId);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  return assertOk("cart.findLine", await query.maybeSingle());
}

async function countCartLines(supabase: DbClient, cartId: string): Promise<number> {
  const { count, error } = await supabase
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("cart_id", cartId);

  assertOk("cart.countLines", { data: null, error });
  return count ?? 0;
}

export async function mergeGuestCartOnLogin(
  supabase: DbClient,
  userId: string,
  sessionId: string
): Promise<void> {
  const userCart =
    (await findActiveCartByUserId(supabase, userId)) ??
    (await createCart(supabase, sessionId, userId));

  const guestCarts = assertOk(
    "cart.guestCartsForMerge",
    await supabase
      .from("carts")
      .select("id")
      .eq("session_id", sessionId)
      .eq("status", "active")
      .neq("id", userCart.id)
  );

  for (const guest of guestCarts ?? []) {
    const guestId = String(guest.id);
    const items = assertOk(
      "cart.guestItems",
      await supabase.from("cart_items").select("*").eq("cart_id", guestId)
    );

    for (const item of items ?? []) {
      const productId = String(item.product_id);
      const variantId = item.variant_id ? String(item.variant_id) : null;
      const productResult = await loadProduct(supabase, productId);
      if (!productResult.ok) continue;

      const stockResult = await loadVariant(supabase, productId, variantId);
      if (!stockResult.ok) continue;

      const unitPrice = effectivePrice(productResult.product);
      const existing = await findExistingLine(
        supabase,
        userCart.id,
        productId,
        variantId
      );

      const mergedQty = Math.min(
        MAX_CART_LINE_QTY,
        Number(existing?.qty ?? 0) + Number(item.qty ?? 0),
        stockResult.availableStock
      );

      if (mergedQty <= 0) continue;

      if (existing?.id) {
        assertOk(
          "cart.mergeUpdate",
          await supabase
            .from("cart_items")
            .update({
              qty: mergedQty,
              unit_price_snapshot: unitPrice,
            })
            .eq("id", existing.id)
        );
      } else {
        assertOk(
          "cart.mergeInsert",
          await supabase.from("cart_items").insert({
            cart_id: userCart.id,
            product_id: productId,
            variant_id: variantId,
            qty: mergedQty,
            unit_price_snapshot: unitPrice,
          })
        );
      }
    }

    assertOk(
      "cart.markConverted",
      await supabase
        .from("carts")
        .update({ status: "converted" })
        .eq("id", guestId)
    );
  }
}

async function resolveActiveCart(
  supabase: DbClient,
  sessionId: string,
  user: User | null
): Promise<Cart> {
  if (user && isSignedInCustomer(user)) {
    await mergeGuestCartOnLogin(supabase, user.id, sessionId);
    const userCart = await findActiveCartByUserId(supabase, user.id);
    if (userCart) return userCart;
    return createCart(supabase, sessionId, user.id);
  }

  if (user) {
    const linked = await findActiveCartByUserId(supabase, user.id);
    if (linked) return linked;
  }

  const guestCart = await findActiveGuestCartBySession(supabase, sessionId);
  if (guestCart) {
    if (user && !guestCart.user_id) {
      assertOk(
        "cart.attachAnonymousUser",
        await supabase
          .from("carts")
          .update({ user_id: user.id })
          .eq("id", guestCart.id)
      );
      guestCart.user_id = user.id;
    }
    return guestCart;
  }

  return createCart(supabase, sessionId, user?.id ?? null);
}

async function buildCartSummary(
  supabase: DbClient,
  cart: Cart,
  actionMessages: string[] = []
): Promise<CartSummary> {
  const rows = assertOk(
    "cart.items",
    await supabase
      .from("cart_items")
      .select(
        "*, product:products(*), variant:product_variants(id, product_id, size, color, stock_count, is_enabled, price_override)"
      )
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: true })
  );

  const couponCode = await getCartCouponCode();
  const items: CartItemView[] = [];
  let subtotal = 0;
  let itemCount = 0;

  for (const row of rows ?? []) {
    const rawProduct = row.product as ProductRow | null | undefined;
    const product = rawProduct
      ? mapProductRow(rawProduct as unknown as Record<string, unknown>)
      : undefined;
    const variant = row.variant
      ? mapVariantRow(row.variant as VariantRow)
      : undefined;

    const currentUnitPrice = rawProduct
      ? effectivePrice(rawProduct)
      : Number(row.unit_price_snapshot);

    const availableStock = variant
      ? variant.is_enabled
        ? variant.stock_count
        : 0
      : product?.stock_count ?? 0;

    const unitPriceSnapshot = Number(row.unit_price_snapshot);
    const qty = Number(row.qty);
    const priceChanged = Math.abs(currentUnitPrice - unitPriceSnapshot) > 0.009;
    const stockReduced = qty > availableStock;
    const lineTotal = Number((unitPriceSnapshot * qty).toFixed(2));

    subtotal += lineTotal;
    itemCount += qty;

    items.push({
      id: String(row.id),
      cart_id: String(row.cart_id),
      product_id: String(row.product_id),
      variant_id: row.variant_id ? String(row.variant_id) : null,
      qty,
      unit_price_snapshot: unitPriceSnapshot,
      created_at: String(row.created_at),
      product,
      variant,
      currentUnitPrice,
      availableStock,
      lineTotal,
      flags: {
        priceChanged,
        stockReduced,
        qtyClamped: false,
      },
    });
  }

  subtotal = Number(subtotal.toFixed(2));

  let discount = 0;
  if (couponCode) {
    const validated = await validateCouponForSubtotal(couponCode, subtotal);
    if (validated.ok) {
      discount = validated.value.discount;
    }
  }

  return {
    ...cart,
    items,
    subtotal,
    discount,
    itemCount,
    couponCode: couponCode ?? null,
    messages: actionMessages,
  };
}

export async function getCart(
  supabase: DbClient,
  sessionId: string,
  user: User | null
): Promise<CartSummary> {
  try {
    const cart = await resolveActiveCart(supabase, sessionId, user);
    return buildCartSummary(supabase, cart);
  } catch (error) {
    if (error instanceof DataError && isMissingCartTable(error.cause as { code?: string; message?: string })) {
      console.warn(
        "[cart] carts table missing — returning empty cart until migration 008 runs"
      );
      return emptyCartSummary(sessionId);
    }
    throw error;
  }
}

export async function addToCartLine(
  supabase: DbClient,
  sessionId: string,
  user: User | null,
  input: { productId: string; variantId?: string | null; qty: number }
): Promise<CartSummary> {
  const messages: string[] = [];
  const cart = await resolveActiveCart(supabase, sessionId, user);

  const productResult = await loadProduct(supabase, input.productId);
  if (!productResult.ok) {
    throw productResult.error;
  }

  const stockResult = await loadVariant(
    supabase,
    input.productId,
    input.variantId
  );
  if (!stockResult.ok) {
    throw stockResult.error;
  }

  if (stockResult.availableStock <= 0) {
    throw {
      code: "OUT_OF_STOCK",
      message: "That item is out of stock.",
    } satisfies CartError;
  }

  const existing = await findExistingLine(
    supabase,
    cart.id,
    input.productId,
    input.variantId ?? null
  );

  if (!existing) {
    const lineCount = await countCartLines(supabase, cart.id);
    if (lineCount >= MAX_CART_LINES) {
      throw {
        code: "CART_FULL",
        message: `Your cart can hold at most ${MAX_CART_LINES} different items.`,
      } satisfies CartError;
    }
  }

  const requestedTotal = Number(existing?.qty ?? 0) + input.qty;
  const clampedQty = Math.min(
    requestedTotal,
    MAX_CART_LINE_QTY,
    stockResult.availableStock
  );

  if (clampedQty <= 0) {
    throw {
      code: "OUT_OF_STOCK",
      message: "That item is out of stock.",
    } satisfies CartError;
  }

  if (clampedQty < input.qty) {
    messages.push(
      `Quantity adjusted to ${clampedQty} — only ${stockResult.availableStock} available in stock.`
    );
  } else if (clampedQty < requestedTotal) {
    messages.push(
      `Quantity adjusted to ${clampedQty} — line limit is ${MAX_CART_LINE_QTY} and stock is ${stockResult.availableStock}.`
    );
  }

  const unitPrice = effectivePrice(productResult.product);

  // Carts do not reserve inventory — stock is decremented on payment capture (26).
  if (existing?.id) {
    assertOk(
      "cart.updateLine",
      await supabase
        .from("cart_items")
        .update({
          qty: clampedQty,
          unit_price_snapshot: unitPrice,
        })
        .eq("id", existing.id)
    );
  } else {
    assertOk(
      "cart.insertLine",
      await supabase.from("cart_items").insert({
        cart_id: cart.id,
        product_id: input.productId,
        variant_id: input.variantId ?? null,
        qty: clampedQty,
        unit_price_snapshot: unitPrice,
      })
    );
  }

  assertOk(
    "cart.touch",
    await supabase
      .from("carts")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cart.id)
  );

  return buildCartSummary(supabase, cart, messages);
}

export async function updateCartLineQty(
  supabase: DbClient,
  sessionId: string,
  user: User | null,
  itemId: string,
  qty: number
): Promise<CartSummary> {
  const messages: string[] = [];
  const cart = await resolveActiveCart(supabase, sessionId, user);

  const line = assertOk(
    "cart.lineById",
    await supabase
      .from("cart_items")
      .select("*")
      .eq("id", itemId)
      .eq("cart_id", cart.id)
      .maybeSingle()
  );

  if (!line) {
    throw {
      code: "NOT_FOUND",
      message: "That cart item no longer exists.",
    } satisfies CartError;
  }

  const stockResult = await loadVariant(
    supabase,
    String(line.product_id),
    line.variant_id ? String(line.variant_id) : null
  );
  if (!stockResult.ok) {
    throw stockResult.error;
  }

  const clampedQty = Math.min(qty, MAX_CART_LINE_QTY, stockResult.availableStock);

  if (clampedQty <= 0) {
    assertOk(
      "cart.removeEmptyLine",
      await supabase.from("cart_items").delete().eq("id", itemId)
    );
  } else {
    if (clampedQty < qty) {
      messages.push(
        `Quantity adjusted to ${clampedQty} — only ${stockResult.availableStock} available in stock.`
      );
    }

    assertOk(
      "cart.updateQty",
      await supabase.from("cart_items").update({ qty: clampedQty }).eq("id", itemId)
    );
  }

  return buildCartSummary(supabase, cart, messages);
}

export async function removeCartLine(
  supabase: DbClient,
  sessionId: string,
  user: User | null,
  itemId: string
): Promise<CartSummary> {
  const cart = await resolveActiveCart(supabase, sessionId, user);

  assertOk(
    "cart.deleteLine",
    await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("cart_id", cart.id)
  );

  return buildCartSummary(supabase, cart);
}

export async function clearCartLines(
  supabase: DbClient,
  sessionId: string,
  user: User | null
): Promise<CartSummary> {
  const cart = await resolveActiveCart(supabase, sessionId, user);

  assertOk(
    "cart.clear",
    await supabase.from("cart_items").delete().eq("cart_id", cart.id)
  );

  return buildCartSummary(supabase, cart);
}

export async function applyCartCoupon(
  supabase: DbClient,
  sessionId: string,
  user: User | null,
  code: string
): Promise<CartSummary> {
  const cart = await resolveActiveCart(supabase, sessionId, user);
  const summary = await buildCartSummary(supabase, cart);

  const validated = await validateCouponForSubtotal(code, summary.subtotal);
  if (!validated.ok) {
    throw {
      code: "INVALID_COUPON",
      message: validated.message,
    } satisfies CartError;
  }

  await setCartCouponCode(validated.value.coupon.code);

  return buildCartSummary(supabase, cart, [
    `Coupon ${validated.value.coupon.code} applied.`,
  ]);
}

export async function removeCartCoupon(
  supabase: DbClient,
  sessionId: string,
  user: User | null
): Promise<CartSummary> {
  await setCartCouponCode(null);
  const cart = await resolveActiveCart(supabase, sessionId, user);
  return buildCartSummary(supabase, cart);
}

export function previewCouponDiscount(coupon: Coupon, subtotal: number): number {
  return computeCouponDiscount(coupon, subtotal);
}
