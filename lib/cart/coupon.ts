import { createServiceClient } from "@/lib/supabase/service";
import type { Coupon } from "@/types";

export interface ValidatedCoupon {
  coupon: Coupon;
  discount: number;
}

export async function validateCouponForSubtotal(
  code: string,
  subtotal: number
): Promise<{ ok: true; value: ValidatedCoupon } | { ok: false; message: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim())
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205") {
      return { ok: false, message: "Coupons are not available yet." };
    }
    return { ok: false, message: "Could not validate the coupon." };
  }

  if (!data) {
    return { ok: false, message: "That coupon code is not valid." };
  }

  const coupon = {
    code: String(data.code),
    type: data.type as Coupon["type"],
    value: Number(data.value),
    min_subtotal: Number(data.min_subtotal ?? 0),
    starts_at: data.starts_at != null ? String(data.starts_at) : null,
    ends_at: data.ends_at != null ? String(data.ends_at) : null,
    usage_limit: data.usage_limit != null ? Number(data.usage_limit) : null,
    used_count: Number(data.used_count ?? 0),
    is_active: Boolean(data.is_active),
  };

  if (!coupon.is_active) {
    return { ok: false, message: "That coupon is no longer active." };
  }

  const now = Date.now();
  if (coupon.starts_at && now < Date.parse(coupon.starts_at)) {
    return { ok: false, message: "That coupon is not valid yet." };
  }
  if (coupon.ends_at && now > Date.parse(coupon.ends_at)) {
    return { ok: false, message: "That coupon has expired." };
  }
  if (
    coupon.usage_limit != null &&
    coupon.used_count >= coupon.usage_limit
  ) {
    return { ok: false, message: "That coupon has reached its usage limit." };
  }
  if (subtotal < coupon.min_subtotal) {
    return {
      ok: false,
      message: `This coupon requires a minimum subtotal of ₹${coupon.min_subtotal.toFixed(2)}.`,
    };
  }

  const discount =
    coupon.type === "percent"
      ? Math.min(subtotal, (subtotal * coupon.value) / 100)
      : Math.min(subtotal, coupon.value);

  return {
    ok: true,
    value: { coupon, discount: Number(discount.toFixed(2)) },
  };
}

export function computeCouponDiscount(
  coupon: Pick<Coupon, "type" | "value">,
  subtotal: number
): number {
  const discount =
    coupon.type === "percent"
      ? Math.min(subtotal, (subtotal * coupon.value) / 100)
      : Math.min(subtotal, coupon.value);

  return Number(discount.toFixed(2));
}
