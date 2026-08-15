import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-free Supabase client for anonymous catalogue reads.
 *
 * This exists so those reads can be cached at all. `lib/supabase/server.ts`
 * calls `cookies()`, and Next 14 throws "Route used `cookies` inside a function
 * cached with `unstable_cache`" the moment you wrap anything built on it.
 *
 * Public catalogue data has no user context, so there is nothing to lose by
 * dropping the session — and RLS still restricts the anon key to active rows.
 * Anything that needs the signed-in user must use `createClient()` instead.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
