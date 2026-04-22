import { NextResponse } from "next/server";
import { resolveMySubscription } from "@/lib/me/subscription";
import {
  fetchSubscription,
  LemonApiError,
} from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/me/subscription
 *
 * Returns the signed-in user's current subscription row + a live
 * snapshot of Lemon's urls bag (for payment-method updates, customer
 * portal). Never leaks fields beyond the user's own row.
 */
export async function GET() {
  const resolved = await resolveMySubscription();
  if ("unauthorized" in resolved || "noProfile" in resolved) {
    return resolved.response;
  }

  const sub = resolved.subscription;
  if (!sub) {
    return NextResponse.json({ subscription: null, lemon: null });
  }

  let lemonUrls: Record<string, string> | null = null;
  let lemonStatus: string | null = null;
  if (sub.lemon_subscription_id) {
    try {
      const live = await fetchSubscription(sub.lemon_subscription_id);
      const attrs = live.attributes as { urls?: Record<string, string>; status?: string };
      lemonUrls = attrs.urls ?? null;
      lemonStatus = attrs.status ?? null;
    } catch (err) {
      // Non-fatal — UI still shows the local row
      console.warn(
        "[me/subscription] lemon fetch failed:",
        err instanceof LemonApiError ? err.status : err,
      );
    }
  }

  return NextResponse.json({
    subscription: sub,
    lemon: lemonUrls ? { urls: lemonUrls, status: lemonStatus } : null,
  });
}
