import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * POST /api/payments/webhook
 * Handles Paddle webhook events for subscription lifecycle.
 * Verify signature, then process event.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("paddle-signature") || "";

    // Verify webhook signature
    if (!verifyPaddleSignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;

    switch (eventType) {
      case "subscription.created":
      case "subscription.activated":
        // TODO: Update user subscription status in Supabase
        console.log(`[Paddle] Subscription activated: ${event.data?.id}`);
        break;

      case "subscription.updated":
        console.log(`[Paddle] Subscription updated: ${event.data?.id}`);
        break;

      case "subscription.canceled":
      case "subscription.past_due":
        console.log(`[Paddle] Subscription ${eventType}: ${event.data?.id}`);
        break;

      case "transaction.completed":
        console.log(`[Paddle] Payment received: ${event.data?.id}`);
        break;

      default:
        console.log(`[Paddle] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

function verifyPaddleSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Paddle v2 signature: ts=TIMESTAMP;h1=HASH
    const parts = signature.split(";");
    const tsPart = parts.find((p) => p.startsWith("ts="));
    const h1Part = parts.find((p) => p.startsWith("h1="));

    if (!tsPart || !h1Part) return false;

    const ts = tsPart.replace("ts=", "");
    const h1 = h1Part.replace("h1=", "");

    const signedPayload = `${ts}:${payload}`;
    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(h1),
      Buffer.from(expectedHash)
    );
  } catch {
    return false;
  }
}
