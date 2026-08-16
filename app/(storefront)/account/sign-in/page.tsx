import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSignInClient } from "@/components/storefront/account/AccountSignInClient";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function AccountSignInPage() {
  return (
    <Suspense fallback={null}>
      <AccountSignInClient />
    </Suspense>
  );
}
