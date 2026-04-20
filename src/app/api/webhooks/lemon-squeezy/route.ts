/**
 * Lemon Squeezy webhook endpoint.
 *
 * Flow:
 * 1. Read RAW body (NOT parsed JSON — HMAC requires raw bytes)
 * 2. Verify X-Signature with LEMONSQUEEZY_WEBHOOK_SECRET (timing-safe)
 * 3. Idempotency check against lemon_webhook_events table
 * 4. Route on event_name, upsert into subscriptions + write audit log
 * 5. Return 200 on success (prevents retry) or 500 on processing error
 *    (triggers Lemon's retry backoff)
 *
 * Signature failure returns 401 without processing — do NOT retry.
 */

import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createServerClient } from "@/lib/db/supabase";
import {
  verifyWebhookSignature,
  type LemonWebhookPayload,
  type LemonEventName,
} from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function eventIdFor(eventName: string, rawBody: string): string {
  // Stable fingerprint of this exact payload — used as dedup key.
  const hash = createHash("sha256").update(rawBody).digest("hex").slice(0, 32);
  return `${eventName}:${hash}`;
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[lemon-webhook] LEMONSQUEEZY_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (!eventName) {
    return NextResponse.json({ error: "missing event_name" }, { status: 400 });
  }

  const db = createServerClient();
  const eventId = eventIdFor(eventName, rawBody);

  // Idempotency: return 200 if we've already processed this exact payload.
  const { data: existing } = await db
    .from("lemon_webhook_events")
    .select("id, processed_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing?.processed_at) {
    return NextResponse.json({ status: "duplicate", id: existing.id });
  }

  // Record the event (idempotency row). If insert conflicts, another
  // request is racing us — safe to continue; final status wins.
  const { data: inserted, error: insertErr } = await db
    .from("lemon_webhook_events")
    .upsert(
      {
        event_id: eventId,
        event_name: eventName,
        webhook_id: payload.meta?.webhook_id ?? null,
        payload: payload as unknown as Record<string, unknown>,
      },
      { onConflict: "event_id" },
    )
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[lemon-webhook] failed to record event", insertErr);
    return NextResponse.json({ error: "record failed" }, { status: 500 });
  }

  try {
    await dispatchEvent(eventName, payload, db);

    await db
      .from("lemon_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", inserted.id);

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[lemon-webhook] ${eventName} handler failed`, err);
    await db
      .from("lemon_webhook_events")
      .update({ error: message })
      .eq("id", inserted.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type Db = ReturnType<typeof createServerClient>;

async function dispatchEvent(
  eventName: LemonEventName,
  payload: LemonWebhookPayload,
  db: Db,
): Promise<void> {
  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_unpaused":
    case "subscription_cancelled":
    case "subscription_expired":
    case "subscription_paused":
    case "subscription_payment_success":
    case "subscription_payment_failed":
    case "subscription_payment_refunded":
      await upsertSubscription(payload, db);
      return;

    case "order_created":
    case "order_refunded":
      // Orders are tracked via the subscription they create; no separate
      // row today. Log for audit only.
      return;
  }
}

async function upsertSubscription(
  payload: LemonWebhookPayload,
  db: Db,
): Promise<void> {
  const attrs = payload.data.attributes as {
    status?: string;
    status_formatted?: string;
    customer_id?: number | string;
    product_id?: number | string;
    variant_id?: number | string;
    order_id?: number | string;
    user_email?: string;
    renews_at?: string | null;
    ends_at?: string | null;
    trial_ends_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  const subId = payload.data.id;
  const userId = payload.meta?.custom_data?.user_id
    ? String(payload.meta.custom_data.user_id)
    : null;

  const row = {
    lemon_subscription_id: subId,
    lemon_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
    lemon_product_id: attrs.product_id ? String(attrs.product_id) : null,
    lemon_variant_id: attrs.variant_id ? String(attrs.variant_id) : null,
    lemon_order_id: attrs.order_id ? String(attrs.order_id) : null,
    email: attrs.user_email ?? null,
    status: attrs.status ?? "active",
    renews_at: attrs.renews_at ?? null,
    ends_at: attrs.ends_at ?? null,
    trial_ends_at: attrs.trial_ends_at ?? null,
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };

  // Fetch previous status for audit log before upserting.
  const { data: prev } = await db
    .from("subscriptions")
    .select("id, status")
    .eq("lemon_subscription_id", subId)
    .maybeSingle();

  const { data: upserted, error } = await db
    .from("subscriptions")
    .upsert(row, { onConflict: "lemon_subscription_id" })
    .select("id")
    .single();

  if (error) throw new Error(`subscription upsert failed: ${error.message}`);

  await db.from("subscription_events").insert({
    subscription_id: upserted?.id ?? null,
    lemon_subscription_id: subId,
    event_type: payload.meta.event_name,
    previous_status: prev?.status ?? null,
    new_status: row.status,
    metadata: { payload_id: payload.data.id },
  });
}
