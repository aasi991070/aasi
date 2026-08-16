import { assertOk } from "@/lib/errors";
import { createServiceClient } from "@/lib/supabase/service";
import type { Shipment } from "@/types";

function mapShipment(row: Record<string, unknown>): Shipment {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    carrier: row.carrier != null ? String(row.carrier) : null,
    awb: row.awb != null ? String(row.awb) : null,
    status: row.status != null ? String(row.status) : null,
    shipped_at: row.shipped_at != null ? String(row.shipped_at) : null,
    delivered_at: row.delivered_at != null ? String(row.delivered_at) : null,
    created_at: String(row.created_at),
  };
}

export async function getShipmentByOrderId(
  orderId: string
): Promise<Shipment | null> {
  const shipments = await getShipmentsByOrderId(orderId);
  return shipments[0] ?? null;
}

export async function getShipmentsByOrderId(
  orderId: string
): Promise<Shipment[]> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") {
      return [];
    }
    assertOk("shipments.byOrder", { data, error });
  }

  return (data ?? []).map(mapShipment);
}
