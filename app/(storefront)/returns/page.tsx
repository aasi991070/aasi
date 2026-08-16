import type { Metadata } from "next";
import { ProseLayout } from "@/components/storefront/ProseLayout";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description: "How to return or exchange an Aasi purchase.",
};

export default function ReturnsPage() {
  return (
    <ProseLayout title="Returns & Exchanges" updatedAt="16 August 2026">
      {/* TODO: legal review before launch */}
      <p>
        We want you to love what arrives. If something is not right, you may
        return or exchange eligible items within the window below.
      </p>
      <h2>Return window</h2>
      <p>
        Items must be postmarked within [[RETURN_WINDOW_DAYS]] of delivery.
      </p>
      <h2>Condition</h2>
      <ul>
        <li>Unworn, unwashed, and with all original tags attached</li>
        <li>In original packaging where provided</li>
        <li>Accompanied by proof of purchase</li>
      </ul>
      <h2>How to start a return</h2>
      <ol>
        <li>
          Email [[SUPPORT_EMAIL]] with your order number and the pieces you
          wish to return.
        </li>
        <li>We will confirm eligibility and share return instructions.</li>
        <li>Ship the item back using the provided label or approved courier.</li>
      </ol>
      <h2>Exchanges</h2>
      <p>
        Size exchanges are subject to stock. If your size is unavailable we will
        offer a refund instead.
      </p>
    </ProseLayout>
  );
}
