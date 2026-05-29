import { V18Shell } from "@/components/shared/V18Shell";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <V18Shell variant="storefront">{children}</V18Shell>;
}
