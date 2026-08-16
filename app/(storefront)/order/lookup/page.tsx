import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderLookupClient } from "@/components/storefront/order/OrderLookupClient";

export const metadata: Metadata = {
  title: "Track order",
  robots: { index: false, follow: false },
};

export default function OrderLookupPage() {
  return (
    <Suspense fallback={null}>
      <OrderLookupClient />
    </Suspense>
  );
}
