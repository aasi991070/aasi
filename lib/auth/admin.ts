import { createClient } from "@/lib/supabase/server";

export type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; message: string };

/**
 * Server-side admin authorisation. Never trust the client for this.
 *
 * Two distinct questions, and they get distinct messages because they need
 * different actions from the person hitting them:
 *   1. Is there a valid session? (expired login → sign in again)
 *   2. Is that user in `admin_users`? (signed in, but not an admin)
 *
 * This mirrors the `is_admin()` gate that RLS applies to the write itself, so
 * a bypass here still hits a closed door at the database. The point of
 * checking early is a usable error message, not the security boundary.
 */
export async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      message: "Your session has expired. Sign in again to save your changes.",
    };
  }

  // RLS on admin_users only exposes the row to is_admin(), so a non-admin sees
  // zero rows rather than an error.
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: "Could not verify your admin access. Please try again.",
    };
  }

  if (!data) {
    return {
      ok: false,
      message:
        "This account is not authorised to edit the catalogue. Ask an administrator to add you to admin_users.",
    };
  }

  return { ok: true, userId: user.id };
}
