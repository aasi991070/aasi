import type { Metadata } from "next";
import { ProseLayout } from "@/components/storefront/ProseLayout";
import { SizeGuideTable } from "@/components/storefront/SizeGuideTable";

export const metadata: Metadata = {
  title: "Size Guide",
  description: "How to measure for Aasi sizes from XS to 3XL.",
};

export default function SizeGuidePage() {
  return (
    <ProseLayout title="Size Guide" updatedAt="16 August 2026">
      {/* TODO: legal review before launch */}
      <p>
        Measure yourself in light clothing, standing naturally. Compare your
        body measurements to the chart below — if you fall between sizes, size
        up for a relaxed fit or down for a closer line.
      </p>
      <h2>How to measure</h2>
      <ul>
        <li>
          <strong>Chest:</strong> around the fullest part, keeping the tape
          level under the arms.
        </li>
        <li>
          <strong>Waist:</strong> around the natural waistline.
        </li>
        <li>
          <strong>Hip:</strong> around the fullest part of the seat.
        </li>
        <li>
          <strong>Shoulder:</strong> from shoulder point to shoulder point
          across the back.
        </li>
        <li>
          <strong>Sleeve:</strong> from shoulder seam to wrist bone with arm
          slightly bent.
        </li>
        <li>
          <strong>Length:</strong> from highest shoulder point to desired hem.
        </li>
      </ul>
      <h2>Size chart</h2>
      <SizeGuideTable />
    </ProseLayout>
  );
}
