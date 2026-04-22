import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/admin/auth";
import { cancelSubscription, LemonApiError } from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/subscriptions/[id]/cancel
 *
 * Schedules cancellation at the end of the current billing period.
 * The customer keeps access until `ends_at`; the
 * `subscription_cancelled` webhook updates the local row when Lemon
 * processes the DELETE.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = requireAdmin(request);
  if (guard) return guard;

  const { id } = await params;
  const db = createServerClient();

  const { data: sub } = await db
    .from("subscriptions")
    .select("lemon_subscription_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!sub?.lemon_subscription_id) {
    return NextResponse.json({ error: "subscription not linked to Lemon" }, { status: 404 });
  }

  try {
    const result = await cancelSubscription(sub.lemon_subscription_id);
    return NextResponse.json({ ok: true, lemon: result.attributes });
  } catch (err) {
    if (err instanceof LemonApiError) {
      return NextResponse.json(
        { error: err.message, status: err.status, body: err.body },
        { status: 502 },
      );
    }
    throw err;
  }
}
