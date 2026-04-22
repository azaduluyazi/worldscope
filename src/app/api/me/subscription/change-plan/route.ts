import { NextResponse } from "next/server";
import { resolveMySubscription } from "@/lib/me/subscription";
import {
  changeSubscriptionVariant,
  LemonApiError,
} from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/me/subscription/change-plan
 * Body: { cycle: "monthly" | "annual" }
 *
 * User-facing plan switcher. Only lets the user move within Gaia tier
 * (cycle change). Cross-tier upgrades go through /api/checkout/tier.
 */
export async function POST(req: Request) {
  const resolved = await resolveMySubscription();
  if ("unauthorized" in resolved || "noProfile" in resolved) {
    return resolved.response;
  }
  const sub = resolved.subscription;
  if (!sub?.lemon_subscription_id) {
    return NextResponse.json({ error: "no subscription" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    cycle?: "monthly" | "annual";
  };
  const variantId =
    body.cycle === "annual"
      ? process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_GAIA_ANNUAL
      : body.cycle === "monthly"
        ? process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_GAIA
        : undefined;
  if (!variantId) {
    return NextResponse.json(
      { error: "cycle (monthly|annual) required + variant env must be set" },
      { status: 400 },
    );
  }

  if (sub.lemon_variant_id === variantId) {
    return NextResponse.json({ error: "already on this plan" }, { status: 409 });
  }

  try {
    // Let Lemon pro-rate by default; user pays delta on next renewal.
    const result = await changeSubscriptionVariant(
      sub.lemon_subscription_id,
      variantId,
    );
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
