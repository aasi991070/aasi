import type { Metadata } from "next";
import { FaqAccordion } from "@/components/storefront/FaqAccordion";
import { ProseLayout } from "@/components/storefront/ProseLayout";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about Aasi orders, shipping, returns, and product care.",
};

export default function FaqPage() {
  return (
    <ProseLayout title="FAQ" updatedAt="16 August 2026">
      {/* TODO: legal review before launch */}
      <p>
        Quick answers to the questions we hear most often. For anything not
        covered here, contact us at [[SUPPORT_EMAIL]].
      </p>
      <FaqAccordion />
    </ProseLayout>
  );
}
