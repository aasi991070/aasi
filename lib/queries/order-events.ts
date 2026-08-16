import { assertOk } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { OrderEvent, OrderEventType } from "@/types";

function mapOrderEvent(row: Record<string, unknown>): OrderEvent {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    actor_id: row.actor_id != null ? String(row.actor_id) : null,
    from_status: row.from_status != null ? String(row.from_status) : null,
    to_status: row.to_status != null ? String(row.to_status) : null,
    event_type: row.event_type as OrderEventType,
    payload:
      row.payload != null
        ? (row.payload as Record<string, unknown>)
        : null,
    created_at: String(row.created_at),
  };
}

export async function insertOrderEvent(input: {
  orderId: string;
  actorId?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  eventType: OrderEventType;
  payload?: Record<string, unknown> | null;
}): Promise<OrderEvent> {
  const supabase = await createClient();
  const created = assertOk(
    "orderEvents.insert",
    await supabase
      .from("order_events")
      .insert({
        order_id: input.orderId,
        actor_id: input.actorId ?? null,
        from_status: input.fromStatus ?? null,
        to_status: input.toStatus ?? null,
        event_type: input.eventType,
        payload: input.payload ?? null,
      })
      .select("*")
      .single()
  );

  return mapOrderEvent(created);
}

export async function getOrderEvents(orderId: string): Promise<OrderEvent[]> {
  const supabase = await createClient();
  const rows = assertOk(
    "orderEvents.list",
    await supabase
      .from("order_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
  );

  return (rows ?? []).map(mapOrderEvent);
}
