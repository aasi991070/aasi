import { getCartSessionId } from "@/lib/cart/session";
import { getCart } from "@/lib/queries/cart";
import { createClient } from "@/lib/supabase/server";
import type { CartSummary } from "@/types";

export async function getServerCart(): Promise<CartSummary | null> {
  const sessionId = await getCartSessionId();
  if (!sessionId) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return await getCart(supabase, sessionId, user);
  } catch {
    return null;
  }
}
