/**
 * POST /api/checkout/tier
 *
 * Body: { slug: "pleiades" | "gaia" | "prometheus" | "pantheon" }
 *
 * Resolves the slug → Lemon Squeezy variant id server-side (so a client
 * can't tamper with the price), binds the current Clerk user id into
 * custom_data so the webhook can link the resulting subscription to
 * the right user_profiles row, and returns { url } — the Lemon-hosted
 * checkout URL the caller redirects to.
 *
 * Auth:
 *   - Signed-out: 401 with { redirect: "/sign-up?redirect_url=/pricing" }.
 *     The client converts that into a router.push.
 *   - Signed-in + already on target tier: 409 with a pointer to the
 *     customer portal (handled by the /api/me/portal route — future).
 *   - Signed-in + already on a DIFFERENT paid tier: see
 *     onExistingSubscription() below — THE DECISION POINT.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createCheckoutUrl } from "@/lib/lemon-squeezy";
import { resolveAccess } from "@/lib/subscriptions/access";
import {
  describeTier,
  SLUG_TO_TIER,
  type TierSlug,
} from "@/lib/subscriptions/tier-config";
import { onExistingSubscription } from "@/lib/subscriptions/upgrade-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  slug: z.enum(["pleiades", "gaia", "prometheus", "pantheon"]),
});

export async function POST(req: Request) {
  // 1. Auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      {
        error: "sign-in required",
        redirect: "/sign-up?redirect_url=/pricing",
      },
      { status: 401 },
    );
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const slug: TierSlug = parsed.data.slug;

  // 3. Tier availability check — variant id must be set in env
  const tier = describeTier(slug);
  if (!tier.purchasable || !tier.variantId) {
    return NextResponse.json(
      { error: "tier not yet available", slug },
      { status: 404 },
    );
  }

  // 4. Existing-subscription policy (the actual trade-off lives here)
  const access = await resolveAccess(userId);
  const targetTier = SLUG_TO_TIER[slug];
  if (access.subscription) {
    const decision = onExistingSubscription({
      currentTier: access.tier,
      targetTier,
      subscriptionStatus: access.subscription.status,
    });
    if (decision.action === "block") {
      return NextResponse.json(
        {
          error: "existing subscription",
          reason: decision.reason,
          portalHint: decision.portalHint,
        },
        { status: 409 },
      );
    }
    // "allow" falls through to normal checkout
  }

  // 5. Create Lemon checkout
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;

  try {
    const url = await createCheckoutUrl({
      variantId: tier.variantId,
      email,
      userId,
      customData: {
        user_id: userId,
        tier_slug: slug,
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://troiamedia.com"}/account?welcome=1`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[checkout/tier] create failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
