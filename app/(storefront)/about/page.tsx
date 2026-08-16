import type { Metadata } from "next";
import { ProseLayout } from "@/components/storefront/ProseLayout";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Aasi — luxury minimal clothing for the modern wardrobe.",
};

export default function AboutPage() {
  return (
    <ProseLayout title="About" updatedAt="16 August 2026">
      {/* TODO: legal review before launch */}
      <p>
        Aasi is a luxury minimal clothing house built around quiet craft,
        precise silhouettes, and materials chosen to last.
      </p>
      <p>
        We design for a modern wardrobe that values restraint over noise — pieces
        that move easily from weekday to evening without demanding attention.
      </p>
      <h2>Our approach</h2>
      <p>
        Every collection begins with fabric. We work with mills and ateliers who
        share our standard for hand-feel, drape, and durability, then cut each
        style with generous seam allowance and thoughtful finishing.
      </p>
      <h2>Registered details</h2>
      <p>
        [[REGISTERED_ENTITY]]
        <br />
        [[REGISTERED_ADDRESS]]
        <br />
        GSTIN: [[GSTIN]]
      </p>
    </ProseLayout>
  );
}
