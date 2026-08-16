import type { Metadata } from "next";
import { ContactForm } from "@/components/storefront/ContactForm";
import { ProseLayout } from "@/components/storefront/ProseLayout";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the Aasi team for orders, sizing, and care questions.",
};

export default function ContactPage() {
  return (
    <ProseLayout title="Contact" updatedAt="16 August 2026">
      {/* TODO: legal review before launch */}
      <p>
        For order updates, sizing advice, or partnership enquiries, write to us
        below or use the details listed here.
      </p>
      <h2>Customer care</h2>
      <ul>
        <li>Email: [[SUPPORT_EMAIL]]</li>
        <li>Phone: [[SUPPORT_PHONE]]</li>
        <li>Hours: [[SUPPORT_HOURS]]</li>
      </ul>
      <h2>Send a message</h2>
      <ContactForm />
    </ProseLayout>
  );
}
