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
import { createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase.generated";
import {
  verifyWebhookSignature,
  type LemonWebhookPayload,
  type LemonEventName,
} from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The webhook handler MUST use the service role key — the
 * `lemon_webhook_events` + `subscriptions` tables have RLS policies
 * that only allow service_role writes. Falling back to the anon key
 * (which the generic `createServerClient` helper does when the service
 * key is missing from env) silently bypasses the insert and returns
 * "record failed" 500s. Fail fast + loud instead.
 */
function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "webhook admin client requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

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
  } catch (err) {
    console.error("[webhooks/lemon-squeezy]", err);
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (!eventName) {
    return NextResponse.json({ error: "missing event_name" }, { status: 400 });
  }

  let db: SupabaseClient<Database>;
  try {
    db = createAdminClient();
  } catch (err) {
    console.error("[lemon-webhook] admin client unavailable:", err);
    return NextResponse.json(
      { error: "server misconfigured: SUPABASE_SERVICE_ROLE_KEY missing" },
      { status: 500 },
    );
  }

  const eventId = eventIdFor(eventName, rawBody);

  // Idempotency: return 200 if we've already processed this exact payload.
  const { data: existing, error: existingErr } = await db
    .from("lemon_webhook_events")
    .select("id, processed_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingErr) {
    console.error("[lemon-webhook] idempotency lookup failed:", existingErr);
    return NextResponse.json(
      { error: "lookup failed", detail: existingErr.message, code: existingErr.code },
      { status: 500 },
    );
  }

  if (existing?.processed_at) {
    return NextResponse.json({ status: "duplicate", id: existing.id });
  }

  // Record the event (idempotency row). `webhook_id` coerced to string
  // because Lemon sends it as an integer.
  const webhookIdRaw = payload.meta?.webhook_id;
  const { data: inserted, error: insertErr } = await db
    .from("lemon_webhook_events")
    .upsert(
      {
        event_id: eventId,
        event_name: eventName,
        webhook_id:
          webhookIdRaw != null ? String(webhookIdRaw) : null,
        // `payload` column is JSONB — cast to the Database-provided Json
        // shape so TS accepts the write. The object is already plain
        // JSON-compatible (parsed from the request body).
        payload: payload as unknown as import("@/types/supabase.generated").Json,
      },
      { onConflict: "event_id" },
    )
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error(
      "[lemon-webhook] failed to record event",
      { eventName, eventId, webhookIdRaw, insertErr },
    );
    return NextResponse.json(
      {
        error: "record failed",
        detail: insertErr?.message,
        code: insertErr?.code,
        hint: insertErr?.hint,
      },
      { status: 500 },
    );
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

type Db = SupabaseClient<Database>;

async function dispatchEvent(
  eventName: LemonEventName,
  payload: LemonWebhookPayload,
  db: Db,
): Promise<void> {
  switch (eventName) {
    case "customer_created":
    case "customer_updated":
    case "license_key_created":
    case "license_key_updated":
      // Audit-only — recorded by the idempotency insert above. No
      // subscriptions side-effect. Keeps the handler non-500 on these.
      return;

    case "subscription_created":
    case "subscription_resumed":
    case "subscription_unpaused":
    case "subscription_payment_success":
      // Activation / re-activation events: after the subscription row
      // is written, ensure a briefing_preferences row exists so the
      // send-weekly-briefings cron will actually pick this user up.
      // Without this the paid subscriber would see no email until they
      // manually opened /preferences — silent churn trigger.
      await upsertSubscription(payload, db);
      await ensureBriefingPreferences(payload, db);
      return;

    case "subscription_updated":
    case "subscription_cancelled":
    case "subscription_expired":
    case "subscription_paused":
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

/**
 * Guarantee the subscriber has a `briefing_preferences` row so the
 * weekly/daily cron can email them. Without this, a paid Gaia
 * subscriber who never opens /preferences receives no briefing —
 * which the cron's inner join on `user_profile_id` silently filters
 * out. See sorunlar/gaia-subscription-no-briefing-email.md.
 *
 * Idempotent via the `user_profile_id` UNIQUE constraint; existing
 * preference rows are left untouched so we don't overwrite the user's
 * own country / locale / quiet-hour choices.
 *
 * Fail-soft: any error is logged but doesn't surface to the caller.
 * The subscription row is the source of truth for billing — losing
 * the preferences row on first activation is recoverable later (user
 * can visit /preferences manually), but flipping the webhook to 500
 * here would make Lemon retry the delivery and re-insert
 * subscription rows we already have.
 */
async function ensureBriefingPreferences(
  payload: LemonWebhookPayload,
  db: Db,
): Promise<void> {
  const userIdRaw = payload.meta?.custom_data?.user_id;
  if (userIdRaw == null) {
    console.warn(
      "[lemon-webhook] activation without user_id — briefing_preferences skipped (anonymous checkout?)",
      { subscriptionId: payload.data.id },
    );
    return;
  }
  const userId = String(userIdRaw);

  try {
    // Look up the user's locale so the first briefing respects their
    // language preference. `user_profiles.id` is the same id we bind
    // to subscription.user_id via custom_data.
    const { data: profile } = await db
      .from("user_profiles")
      .select("id, locale")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      console.warn(
        "[lemon-webhook] no user_profile for user_id — briefing_preferences skipped",
        { userId },
      );
      return;
    }

    // CHECK constraint briefing_preferences_locale_valid accepts only
    // 'en' | 'tr'; fall back to 'en' for any other profile locale.
    const locale = profile.locale === "tr" ? "tr" : "en";

    const { error } = await db.from("briefing_preferences").upsert(
      {
        user_profile_id: profile.id,
        country_codes: [],
        daily_enabled: false,
        weekly_enabled: true,
        locale,
        unsubscribe_token: randomBytes(24).toString("base64url"),
        quiet_hours_enabled: false,
        quiet_start: "22:00:00",
        quiet_end: "07:00:00",
        timezone: "UTC",
      },
      { onConflict: "user_profile_id", ignoreDuplicates: true },
    );

    if (error) {
      console.error(
        "[lemon-webhook] briefing_preferences upsert failed (non-fatal)",
        { userId, code: error.code, message: error.message },
      );
    }
  } catch (err) {
    console.error(
      "[lemon-webhook] ensureBriefingPreferences unexpected (non-fatal)",
      err,
    );
  }
}
