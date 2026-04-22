import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/admin/auth";
import {
  fetchSubscription,
  listSubscriptionInvoices,
  LemonApiError,
} from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/subscriptions/[id]
 *
 * Returns: local subscription row + event timeline + live Lemon state
 * + recent invoices. The local row may be up to ~minutes stale if a
 * webhook is in flight; `lemon` is fetched live for accuracy.
 *
 * `id` is the Supabase UUID of the row, not the lemon_subscription_id.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = requireAdmin(request);
  if (guard) return guard;

  const { id } = await params;
  const db = createServerClient();

  const { data: sub, error: subErr } = await db
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
  if (!sub) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: events } = await db
    .from("subscription_events")
    .select("id, event_type, previous_status, new_status, metadata, created_at")
    .eq("subscription_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  let lemon: unknown = null;
  let invoices: unknown = null;
  let lemonError: string | null = null;

  if (sub.lemon_subscription_id) {
    try {
      lemon = (await fetchSubscription(sub.lemon_subscription_id)).attributes;
      invoices = await listSubscriptionInvoices(sub.lemon_subscription_id);
    } catch (err) {
      // Lemon fetch is nice-to-have; don't fail the whole response.
      lemonError =
        err instanceof LemonApiError
          ? `${err.status}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Lemon fetch failed";
    }
  }

  return NextResponse.json({
    subscription: sub,
    events: events ?? [],
    lemon,
    invoices,
    lemon_error: lemonError,
  });
}
