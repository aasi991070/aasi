import type { Metadata } from "next";
import { ProseLayout } from "@/components/storefront/ProseLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the Aasi website and purchases.",
};

export default function TermsPage() {
  return (
    <ProseLayout title="Terms of Service" updatedAt="16 August 2026">
      {/* TODO: legal review before launch */}
      <p>
        These terms govern your access to the Aasi website and any purchase you
        make from us. By using the site you agree to them.
      </p>
      <h2>Who we are</h2>
      <p>
        This website is operated by [[REGISTERED_ENTITY]], registered at
        [[REGISTERED_ADDRESS]] (GSTIN [[GSTIN]]).
      </p>
      <h2>Using the site</h2>
      <p>
        You must be at least 18 years old to purchase. You agree not to misuse
        the site, attempt unauthorised access, or interfere with its operation.
      </p>
      <h2>Products and pricing</h2>
      <p>
        We describe products as accurately as possible. Prices are shown in INR
        and include applicable taxes unless stated otherwise. We may correct
        pricing errors before accepting an order.
      </p>
      <h2>Orders and payment</h2>
      <p>
        Placing an order is an offer to buy. We confirm acceptance when payment
        is captured. Risk passes to you on delivery.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, our liability is limited to the amount
        you paid for the relevant order.
      </p>
      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of [[JURISDICTION]]. Disputes are
        subject to the exclusive jurisdiction of courts in that territory.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms: [[SUPPORT_EMAIL]], [[SUPPORT_PHONE]],
        [[SUPPORT_HOURS]].
      </p>
    </ProseLayout>
  );
}
