/** Convert order total (INR, numeric(10,2)) to integer paise for Razorpay. */
export function orderTotalToPaise(total: number | string): number {
  const amount = Math.round(Number(total) * 100);

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Invalid Razorpay amount: ${total}`);
  }

  return amount;
}

export function paiseToInr(amountPaise: number): number {
  return Number((amountPaise / 100).toFixed(2));
}
