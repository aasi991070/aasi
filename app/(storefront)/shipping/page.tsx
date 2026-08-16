import type { Metadata } from "next";
import { ProseLayout } from "@/components/storefront/ProseLayout";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: "How Aasi ships across India, including timelines and tracking.",
};

export default function ShippingPage() {
  return (
    <ProseLayout title="Shipping & Delivery" updatedAt="16 August 2026">
      {/* TODO: legal review before launch */}
      <p>
        We dispatch every order from our fulfilment partner with tracked
        shipping across India.
      </p>
      <h2>Delivery timeline</h2>
      <p>
        Standard delivery is typically completed within [[DELIVERY_SLA]] of
        dispatch. Remote or service-restricted pin codes may require additional
        time.
      </p>
      <h2>Shipping partners</h2>
      <p>Orders ship via [[SHIPPING_PARTNERS]].</p>
      <h2>Tracking</h2>
      <p>
        Once your order leaves our warehouse you will receive a tracking link by
        email. If tracking has not updated within 48 hours of dispatch, contact
        us at [[SUPPORT_EMAIL]].
      </p>
      <h2>Delivery attempts</h2>
      <p>
        Couriers will attempt delivery twice. Uncollected parcels return to us
        and may be re-shipped at your cost.
      </p>
    </ProseLayout>
  );
}
