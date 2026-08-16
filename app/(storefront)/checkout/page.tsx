import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutPageClient } from "@/components/storefront/checkout/CheckoutPageClient";
import { validateCouponForSubtotal } from "@/lib/cart/coupon";
import { isSignedInCustomer } from "@/lib/cart/identity";
import { getServerCart } from "@/lib/cart/server";
import { getUserAddresses } from "@/lib/queries/addresses";
import { getProductTaxRates } from "@/lib/queries/product-tax";
import { getShippingRates } from "@/lib/queries/shipping";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Aasi order with contact, shipping, and delivery details.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const cart = await getServerCart();

  if (!cart?.items.length) {
    redirect("/cart");
  }

  const [shippingRates, productTaxRates, supabase] = await Promise.all([
    getShippingRates(),
    getProductTaxRates(cart.items.map((item) => item.product_id)),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const savedAddresses =
    user && isSignedInCustomer(user)
      ? await getUserAddresses(user.id)
      : [];

  let coupon = null;
  if (cart.couponCode) {
    const couponResult = await validateCouponForSubtotal(
      cart.couponCode,
      cart.subtotal
    );
    if (couponResult.ok) {
      coupon = couponResult.value.coupon;
    }
  }

  return (
    <CheckoutPageClient
      initialCart={cart}
      shippingRates={shippingRates}
      productTaxRates={productTaxRates}
      coupon={coupon}
      savedAddresses={savedAddresses}
      defaultContact={{
        email: user?.email ?? "",
        phone: "",
      }}
    />
  );
}
