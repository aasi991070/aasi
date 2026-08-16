import { NextResponse } from "next/server";
import { handleRazorpayWebhookEvent } from "@/lib/payments/webhook-events";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/webhook-signature";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  try {
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const body = JSON.parse(rawBody) as unknown;
    await handleRazorpayWebhookEvent(body);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[razorpay/webhook]", error);
    return NextResponse.json({ received: true });
  }
}
