import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppToaster } from "@/components/shared/AppToaster";
import { V18Shell } from "@/components/shared/V18Shell";
import { MonochromeProvider } from "@/components/providers/MonochromeProvider";
import { BRAND_ADMIN_NAME } from "@/constants";
import { getSiteSettings } from "@/lib/queries/settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    default: BRAND_ADMIN_NAME,
    template: `%s | ${BRAND_ADMIN_NAME}`,
  },
};

export default async function AdminCmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const settings = await getSiteSettings();

  return (
    <MonochromeProvider initialMonochrome={settings.monochrome_enabled}>
      <AppToaster />
      <V18Shell>{children}</V18Shell>
    </MonochromeProvider>
  );
}
