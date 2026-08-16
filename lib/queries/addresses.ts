import { assertOk } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Address, OrderAddressSnapshot } from "@/types";

function mapAddress(row: Record<string, unknown>): Address {
  return {
    id: String(row.id),
    user_id: row.user_id != null ? String(row.user_id) : null,
    name: String(row.name),
    line1: String(row.line1),
    line2: row.line2 != null ? String(row.line2) : undefined,
    city: String(row.city),
    state: String(row.state),
    pincode: String(row.pincode),
    country: String(row.country),
    phone: row.phone != null ? String(row.phone) : undefined,
    type: row.type as Address["type"],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getUserAddresses(userId: string): Promise<Address[]> {
  const supabase = await createClient();
  const data = assertOk(
    "addresses.byUser",
    await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "shipping")
      .order("created_at", { ascending: false })
  );

  return (data ?? []).map(mapAddress);
}

export async function saveUserAddress(
  userId: string,
  address: OrderAddressSnapshot
): Promise<Address> {
  const supabase = await createClient();
  const created = assertOk(
    "addresses.create",
    await supabase
      .from("addresses")
      .insert({
        user_id: userId,
        name: address.name,
        line1: address.line1,
        line2: address.line2 ?? null,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        phone: address.phone ?? null,
        type: "shipping",
      })
      .select("*")
      .single()
  );

  return mapAddress(created);
}
