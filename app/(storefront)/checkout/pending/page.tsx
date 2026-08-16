import type { Metadata } from "next";
import { CheckoutPendingPage } from "@/components/storefront/checkout/CheckoutPendingClient";

export const metadata: Metadata = {
  title: "Order pending payment",
  robots: { index: false, follow: false },
};

export default CheckoutPendingPage;
