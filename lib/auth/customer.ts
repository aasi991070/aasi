import type { User } from "@supabase/supabase-js";
import { isSignedInCustomer } from "@/lib/cart/identity";
import { createClient } from "@/lib/supabase/server";

export class CustomerAuthError extends Error {
  constructor(message = "Sign in required") {
    super(message);
    this.name = "CustomerAuthError";
  }
}

export async function getCustomerUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSignedInCustomer(user)) {
    return null;
  }

  return user;
}

export async function requireCustomer(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSignedInCustomer(user)) {
    throw new CustomerAuthError();
  }

  return { supabase, user };
}

export interface CustomerProfile {
  fullName: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
}

export function profileFromUser(user: User): CustomerProfile {
  const metadata = user.user_metadata ?? {};

  return {
    fullName: typeof metadata.full_name === "string" ? metadata.full_name : "",
    email: user.email ?? "",
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
    marketingOptIn: metadata.marketing_opt_in === true,
  };
}
