import { cookies } from "next/headers";
import {
  CART_COUPON_COOKIE,
  CART_SESSION_COOKIE,
  CART_SESSION_MAX_AGE,
} from "@/lib/cart/constants";

export function cartSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_SESSION_MAX_AGE,
    path: "/",
  };
}

export async function getCartSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_SESSION_COOKIE)?.value;
}

export async function getCartCouponCode(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CART_COUPON_COOKIE)?.value?.trim();
  return value || undefined;
}

export async function setCartCouponCode(code: string | null): Promise<void> {
  const cookieStore = await cookies();

  if (!code) {
    cookieStore.delete(CART_COUPON_COOKIE);
    return;
  }

  cookieStore.set(CART_COUPON_COOKIE, code, {
    ...cartSessionCookieOptions(),
    httpOnly: true,
  });
}
