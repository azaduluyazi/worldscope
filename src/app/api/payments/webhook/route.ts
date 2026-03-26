import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/payments/webhook
 * Handles Paddle webhook events for mail subscription lifecycle.
 * On subscription.created → add to newsletter_subscribers as premium
 * On subscription.canceled → deactivate subscriber
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("paddle-signature") || "";

    if (!verifyPaddleSignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const customerEmail = event.data?.customer?.email?.toLowerCase();
    const subscriptionId = event.data?.id;

    console.log(`[Paddle] ${eventType}: ${subscriptionId} (${customerEmail})`);

    switch (eventType) {
      case "subscription.created":
      case "subscription.activated": {
        if (customerEmail) {
          await supabase.from("newsletter_subscribers").upsert({
            email: customerEmail,
            frequency: "daily",
            tier: "premium",
            is_active: true,
            paddle_subscription_id: subscriptionId,
            subscribed_at: new Date().toISOString(),
          }, { onConflict: "email" });

          // Also update subscriptions table if user exists
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("email", customerEmail)
            .single();

          if (profile) {
            await supabase.from("subscriptions").upsert({
              user_id: profile.id,
              plan: "pro",
              status: "active",
              paddle_subscription_id: subscriptionId,
              paddle_customer_id: event.data?.customer?.id,
              current_period_start: event.data?.current_billing_period?.starts_at,
              current_period_end: event.data?.current_billing_period?.ends_at,
              updated_at: new Date().toISOString(),
            }, { onConflict: "paddle_subscription_id" });
          }
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.past_due": {
        if (customerEmail) {
          await supabase
            .from("newsletter_subscribers")
            .update({ is_active: eventType !== "subscription.canceled", tier: "free" })
            .eq("email", customerEmail);

          await supabase
            .from("subscriptions")
            .update({ status: eventType === "subscription.canceled" ? "cancelled" : "past_due", updated_at: new Date().toISOString() })
            .eq("paddle_subscription_id", subscriptionId);
        }
        break;
      }

      case "subscription.updated": {
        console.log(`[Paddle] Subscription updated: ${subscriptionId}`);
        if (customerEmail && event.data?.current_billing_period) {
          await supabase
            .from("subscriptions")
            .update({
              current_period_start: event.data.current_billing_period.starts_at,
              current_period_end: event.data.current_billing_period.ends_at,
              updated_at: new Date().toISOString(),
            })
            .eq("paddle_subscription_id", subscriptionId);
        }
        break;
      }

      case "transaction.completed":
        console.log(`[Paddle] Payment received: ${event.data?.id} — $${event.data?.details?.totals?.total}`);
        break;

      default:
        console.log(`[Paddle] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Paddle] Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

function verifyPaddleSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const parts = signature.split(";");
    const tsPart = parts.find((p) => p.startsWith("ts="));
    const h1Part = parts.find((p) => p.startsWith("h1="));
    if (!tsPart || !h1Part) return false;

    const ts = tsPart.replace("ts=", "");
    const h1 = h1Part.replace("h1=", "");
    const signedPayload = `${ts}:${payload}`;
    const expectedHash = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(expectedHash));
  } catch {
    return false;
  }
}
