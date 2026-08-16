"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  CustomerAuthError,
  profileFromUser,
  requireCustomer,
} from "@/lib/auth/customer";
import { assertOk } from "@/lib/errors";
import {
  deleteUserAddress,
  saveUserAddress,
  updateUserAddress,
} from "@/lib/queries/addresses";
import { getOrderByNumber } from "@/lib/queries/orders";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { hashClientIpFromHeaders } from "@/lib/security/reviewRateLimit";
import {
  emailsMatchConstantTime,
  ORDER_LOOKUP_FAIL_MESSAGE,
} from "@/lib/security/orderLookup";
import { consumeOrderLookupRateLimit } from "@/lib/security/orderLookupRateLimit";
import { formatZodError } from "@/lib/validation/catalog";
import {
  addressFormSchema,
  orderLookupSchema,
  profileSchema,
} from "@/lib/validation/account";
import type { OrderAddressSnapshot } from "@/types";

export type AccountActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export type OrderLookupResult =
  | { ok: true; orderNumber: string }
  | { ok: false; message: string };

export async function linkGuestOrdersAction(): Promise<AccountActionResult> {
  try {
    const { user } = await requireCustomer();
    const email = user.email;

    if (!email) {
      return { ok: false, message: "Your account has no email address." };
    }

    const service = createServiceClient();
    assertOk(
      "account.linkOrders",
      await service
        .from("orders")
        .update({ user_id: user.id })
        .eq("email", email)
        .is("user_id", null)
    );

    revalidatePath("/account");
    revalidatePath("/account/orders");

    return { ok: true };
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return { ok: false, message: error.message };
    }

    return { ok: false, message: "Could not link your orders." };
  }
}

export async function updateProfileAction(
  input: unknown
): Promise<AccountActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: formatZodError(parsed.error) };
  }

  try {
    const { user } = await requireCustomer();
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
        marketing_opt_in: parsed.data.marketingOptIn,
      },
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    void user;
    revalidatePath("/account/profile");
    return { ok: true, message: "Profile updated." };
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return { ok: false, message: error.message };
    }

    return { ok: false, message: "Could not update your profile." };
  }
}

export async function saveAddressAction(
  input: unknown
): Promise<AccountActionResult> {
  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: formatZodError(parsed.error) };
  }

  try {
    const { user } = await requireCustomer();
    await saveUserAddress(user.id, parsed.data as OrderAddressSnapshot);
    revalidatePath("/account/addresses");
    return { ok: true, message: "Address saved." };
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return { ok: false, message: error.message };
    }

    return { ok: false, message: "Could not save the address." };
  }
}

export async function updateAddressAction(
  addressId: string,
  input: unknown
): Promise<AccountActionResult> {
  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: formatZodError(parsed.error) };
  }

  try {
    const { user } = await requireCustomer();
    await updateUserAddress(
      user.id,
      addressId,
      parsed.data as OrderAddressSnapshot
    );
    revalidatePath("/account/addresses");
    return { ok: true, message: "Address updated." };
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return { ok: false, message: error.message };
    }

    return { ok: false, message: "Could not update the address." };
  }
}

export async function deleteAddressAction(
  addressId: string
): Promise<AccountActionResult> {
  try {
    const { user } = await requireCustomer();
    await deleteUserAddress(user.id, addressId);
    revalidatePath("/account/addresses");
    return { ok: true, message: "Address removed." };
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return { ok: false, message: error.message };
    }

    return { ok: false, message: "Could not remove the address." };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/account/sign-in");
}

export async function lookupOrderAction(
  input: unknown
): Promise<OrderLookupResult> {
  const parsed = orderLookupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: ORDER_LOOKUP_FAIL_MESSAGE };
  }

  try {
    const headerStore = await headers();
    const ipHash = hashClientIpFromHeaders(headerStore) ?? "unknown";
    const allowed = await consumeOrderLookupRateLimit(ipHash);

    if (!allowed) {
      return { ok: false, message: ORDER_LOOKUP_FAIL_MESSAGE };
    }

    const order = await getOrderByNumber(parsed.data.orderNumber);
    const orderEmail = order?.email ?? "unknown@example.com";
    const matches = order
      ? emailsMatchConstantTime(parsed.data.email, orderEmail)
      : false;

    if (!matches || !order) {
      return { ok: false, message: ORDER_LOOKUP_FAIL_MESSAGE };
    }

    return { ok: true, orderNumber: order.order_number };
  } catch {
    return { ok: false, message: ORDER_LOOKUP_FAIL_MESSAGE };
  }
}

export async function getProfileAction() {
  const { user } = await requireCustomer();
  return profileFromUser(user);
}
