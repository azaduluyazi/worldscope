import { NextResponse } from "next/server";
import { resolveMySubscription } from "@/lib/me/subscription";
import { resumeSubscription, LemonApiError } from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/me/subscription/resume — undo a pending cancellation. */
export async function POST() {
  const resolved = await resolveMySubscription();
  if ("unauthorized" in resolved || "noProfile" in resolved) {
    return resolved.response;
  }
  const sub = resolved.subscription;
  if (!sub?.lemon_subscription_id) {
    return NextResponse.json({ error: "no subscription" }, { status: 404 });
  }
  try {
    const result = await resumeSubscription(sub.lemon_subscription_id);
    return NextResponse.json({ ok: true, lemon: result.attributes });
  } catch (err) {
    if (err instanceof LemonApiError) {
      return NextResponse.json(
        { error: err.message, status: err.status },
        { status: 502 },
      );
    }
    throw err;
  }
}
