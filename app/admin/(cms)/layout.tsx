import { redirect } from "next/navigation";
import { V18Shell } from "@/components/shared/V18Shell";
import { createClient } from "@/lib/supabase/server";

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

  return <V18Shell variant="admin">{children}</V18Shell>;
}
