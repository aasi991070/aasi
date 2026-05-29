import type { Metadata } from "next";
import { BRAND_ADMIN_NAME } from "@/constants";

export const metadata: Metadata = {
  title: BRAND_ADMIN_NAME,
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
