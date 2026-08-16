import type { OrderStatus, Shipment } from "@/types";
import { cn } from "@/lib/utils";

const STEPS: Array<{ key: OrderStatus; label: string }> = [
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function stepIndex(status: OrderStatus): number {
  switch (status) {
    case "pending":
      return -1;
    case "confirmed":
      return 0;
    case "packed":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    case "cancelled":
    case "returned":
      return -1;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

interface OrderFulfillmentTimelineProps {
  status: OrderStatus;
  shipment?: Shipment | null;
}

export function OrderFulfillmentTimeline({
  status,
  shipment,
}: OrderFulfillmentTimelineProps) {
  const activeIndex = stepIndex(status);

  if (activeIndex < 0 && status !== "pending") {
    return null;
  }

  return (
    <div className="mt-10 text-left">
      <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
        Fulfilment
      </h2>
      <ol className="mt-4 space-y-4">
        {STEPS.map((step, index) => {
          const complete = activeIndex >= index;
          const current = activeIndex === index;

          return (
            <li
              key={step.key}
              className={cn(
                "flex items-start gap-3 font-sans text-sm",
                complete ? "text-store-ink" : "text-store-ink-muted"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex size-5 items-center justify-center rounded-full border text-[0.625rem]",
                  complete
                    ? "border-store-accent bg-store-accent text-store-white"
                    : "border-store-border"
                )}
                aria-hidden="true"
              >
                {complete ? "✓" : index + 1}
              </span>
              <span>
                <span className={current ? "font-medium" : undefined}>
                  {step.label}
                </span>
                {step.key === "shipped" && shipment?.carrier ? (
                  <span className="mt-1 block text-store-ink-muted">
                    {shipment.carrier}
                    {shipment.awb ? ` · AWB ${shipment.awb}` : ""}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
