import type { Metadata } from "next";
import { ProseLayout } from "@/components/storefront/ProseLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Aasi collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <ProseLayout title="Privacy Policy" updatedAt="16 August 2026">
      {/* TODO: legal review before launch */}
      <p>
        [[REGISTERED_ENTITY]] (&quot;Aasi&quot;, &quot;we&quot;, &quot;us&quot;)
        respects your privacy. This policy explains what we collect when you
        use our website and how we use it.
      </p>
      <h2>Data controller</h2>
      <p>
        [[REGISTERED_ENTITY]]
        <br />
        [[REGISTERED_ADDRESS]]
        <br />
        GSTIN: [[GSTIN]]
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Contact details you provide at checkout or on forms</li>
        <li>Order and payment references processed by our payment partner</li>
        <li>Technical data such as IP address and browser type for security</li>
        <li>Newsletter email if you subscribe</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        We use your data to fulfil orders, respond to enquiries, improve the
        site, and — with consent — send marketing email. We do not sell personal
        data.
      </p>
      <h2>Retention</h2>
      <p>
        We keep order records as required for tax and accounting. Marketing
        preferences are kept until you unsubscribe.
      </p>
      <h2>Your rights</h2>
      <p>
        You may request access, correction, or deletion of your personal data
        by writing to [[SUPPORT_EMAIL]].
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions: [[SUPPORT_EMAIL]], [[SUPPORT_PHONE]], [[SUPPORT_HOURS]].
      </p>
    </ProseLayout>
  );
}
