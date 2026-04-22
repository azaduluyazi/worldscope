import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/subscriptions
 *
 * Lists all subscriptions + a summary row with MRR / active count /
 * churned-last-30d. Supports ?status=active|cancelled|... filter and
 * ?q=<email> substring search.
 */
export async function GET(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const emailSearch = searchParams.get("q")?.trim().toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  const db = createServerClient();

  let query = db
    .from("subscriptions")
    .select(
      "id, user_id, lemon_subscription_id, lemon_customer_id, lemon_variant_id, email, status, plan, billing_cycle, price_cents, currency, renews_at, ends_at, trial_ends_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (emailSearch) query = query.ilike("email", `%${emailSearch}%`);

  const { data: subs, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Summary — run on the full table regardless of filters so ops sees
  // the real totals.
  const { data: all } = await db
    .from("subscriptions")
    .select("status, billing_cycle, price_cents, ends_at, created_at");

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  let active = 0;
  let paused = 0;
  let cancelledActive = 0;
  let churned30d = 0;
  let mrrCents = 0;
  const newLast30d: number[] = [];
  let byCycle: Record<string, number> = { monthly: 0, annual: 0, unknown: 0 };

  for (const row of all ?? []) {
    const status = row.status ?? "unknown";
    const isLiveDelivering =
      status === "active" || status === "on_trial" || status === "past_due";
    if (isLiveDelivering) active += 1;
    if (status === "paused") paused += 1;
    if (status === "cancelled" && row.ends_at && Date.parse(row.ends_at) > now) {
      cancelledActive += 1;
    }

    // Churn: anything that ended in the last 30 days
    if (
      (status === "expired" || status === "cancelled") &&
      row.ends_at &&
      now - Date.parse(row.ends_at) < THIRTY_DAYS &&
      Date.parse(row.ends_at) <= now
    ) {
      churned30d += 1;
    }

    // MRR: monthly price as-is, annual/12
    if (isLiveDelivering && row.price_cents != null) {
      if (row.billing_cycle === "monthly") mrrCents += row.price_cents;
      else if (row.billing_cycle === "annual") mrrCents += Math.round(row.price_cents / 12);
    }

    if (row.created_at && now - Date.parse(row.created_at) < THIRTY_DAYS) {
      newLast30d.push(now - Date.parse(row.created_at));
    }

    const cycle = row.billing_cycle ?? "unknown";
    byCycle = { ...byCycle, [cycle]: (byCycle[cycle] ?? 0) + 1 };
  }

  return NextResponse.json({
    subscriptions: subs ?? [],
    summary: {
      total: all?.length ?? 0,
      active,
      paused,
      cancelled_pending: cancelledActive,
      churned_30d: churned30d,
      new_30d: newLast30d.length,
      mrr_cents: mrrCents,
      arr_cents: mrrCents * 12,
      by_cycle: byCycle,
    },
  });
}
