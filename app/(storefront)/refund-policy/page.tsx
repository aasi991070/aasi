import type { Metadata } from "next";
import { ProseLayout } from "@/components/storefront/ProseLayout";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "When and how Aasi issues refunds and accepts cancellations.",
};

export default function RefundPolicyPage() {
  return (
    <ProseLayout title="Refund & Cancellation Policy" updatedAt="16 August 2026">
      {/* TODO: legal review before launch */}
      <p>
        This policy explains when you may cancel an order, return a product, and
        receive a refund from [[REGISTERED_ENTITY]].
      </p>
      <h2>Cancellations</h2>
      <p>
        Orders may be cancelled before dispatch by contacting [[SUPPORT_EMAIL]]
        with your order number. Once shipped, cancellation is not available —
        please follow the returns process instead.
      </p>
      <h2>Eligible returns</h2>
      <p>
        Returns are accepted within [[RETURN_WINDOW_DAYS]] of delivery for
        unworn items in original condition, as described on our Returns page.
      </p>
      <h2>Refund timing</h2>
      <p>
        Approved refunds are initiated within [[REFUND_WINDOW_DAYS]] of us
        receiving and inspecting the returned item. Funds return to the
        original payment method; bank processing times vary.
      </p>
      <h2>Non-refundable items</h2>
      <ul>
        <li>Final-sale or customised pieces unless defective</li>
        <li>Items returned outside the return window or without tags</li>
        <li>Shipping charges on change-of-mind returns unless required by law</li>
      </ul>
      <h2>Contact</h2>
      <p>
        Refund enquiries: [[SUPPORT_EMAIL]], [[SUPPORT_PHONE]], [[SUPPORT_HOURS]].
      </p>
    </ProseLayout>
  );
}
