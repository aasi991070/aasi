/**
 * Transactional email hooks — implemented in prompt 27c.
 * Failures here must never roll back order state changes.
 */

export async function sendOrderShippedEmail(orderId: string): Promise<void> {
  void orderId;
  // TODO(27c): Resend template
}

export async function sendOrderDeliveredEmail(orderId: string): Promise<void> {
  void orderId;
  // TODO(27c): Resend template
}

export async function sendOrderCancelledEmail(orderId: string): Promise<void> {
  void orderId;
  // TODO(27c): Resend template
}

export async function sendOrderRefundedEmail(orderId: string): Promise<void> {
  void orderId;
  // TODO(27c): Resend template
}
