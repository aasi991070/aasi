import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCartSessionId } from "@/lib/cart/session";

export function isAnonymousUser(user: User): boolean {
  return user.is_anonymous === true;
}

export function isSignedInCustomer(user: User): boolean {
  return !isAnonymousUser(user);
}

export async function ensureCartIdentity(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
  sessionId: string;
}> {
  const sessionId = await getCartSessionId();
  if (!sessionId) {
    throw new Error("Missing cart session cookie");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { supabase, user, sessionId };
  }

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw error;
  }

  const {
    data: { user: anonymousUser },
  } = await supabase.auth.getUser();

  return { supabase, user: anonymousUser, sessionId };
}
