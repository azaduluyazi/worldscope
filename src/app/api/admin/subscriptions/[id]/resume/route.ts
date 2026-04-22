import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/admin/auth";
import { resumeSubscription, LemonApiError } from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/subscriptions/[id]/resume — un-cancel before ends_at. */
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
    .select("lemon_subscription_id")
    .eq("id", id)
    .maybeSingle();

  if (!sub?.lemon_subscription_id) {
    return NextResponse.json({ error: "subscription not linked to Lemon" }, { status: 404 });
  }

  try {
    const result = await resumeSubscription(sub.lemon_subscription_id);
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
