import type { OrderStatus } from "@/types";

const ALLOWED: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export type OrderTransitionErrorCode = "INVALID_TRANSITION" | "TERMINAL_STATUS";

export interface OrderTransitionError {
  code: OrderTransitionErrorCode;
  message: string;
}

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  if (from === to) {
    return false;
  }

  return ALLOWED[from].includes(to);
}

export function assertOrderTransition(
  from: OrderStatus,
  to: OrderStatus
): OrderTransitionError | null {
  if (from === to) {
    return {
      code: "INVALID_TRANSITION",
      message: "The order is already in that status.",
    };
  }

  if (!ALLOWED[from].length) {
    return {
      code: "TERMINAL_STATUS",
      message: `Orders in "${from}" status cannot be changed.`,
    };
  }

  if (!canTransitionOrderStatus(from, to)) {
    return {
      code: "INVALID_TRANSITION",
      message: `Cannot move an order from "${from}" to "${to}".`,
    };
  }

  return null;
}

export function allowedNextStatuses(from: OrderStatus): OrderStatus[] {
  return [...ALLOWED[from]];
}
