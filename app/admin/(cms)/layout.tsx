import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { V18Shell } from "@/components/shared/V18Shell";
import { BRAND_ADMIN_NAME } from "@/constants";
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

  return <V18Shell>{children}</V18Shell>;
}
