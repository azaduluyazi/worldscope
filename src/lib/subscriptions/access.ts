/**
 * Subscription access helpers.
 *
 * Maps the Supabase auth.users.id to a local user_profiles row, then
 * reads subscriptions to decide which tier the user is on and what
 * features they can see. Pure data layer — no UI, no redirects.
 */

import { createServerClient } from "@/lib/db/supabase";

/**
 * Tier catalogue — deliberately minimal.
 *
 * Single paid tier strategy (decided 2026-04-21): one price, one product,
 * one checkout URL. Removes tier-switch complexity from onboarding and
 * locks the revenue model to a flat "N × $9" formula. When paid-API
 * features (Finnhub live, DeepSeek reasoning, scenario engine with
 * outside inference) land, a second "Pro+" tier will be added above
 * this one. Until then every subscriber gets everything.
 *
 * The DB CHECK constraint on subscriptions.plan (migration 024) stays
 * permissive (free|briefing_country|bundle5|global|pro|team|enterprise)
 * to keep the schema forward-compatible, but code-level TierId is
 * narrowed to what we actually sell today.
 */
export type TierId = "free" | "global" | "enterprise";

export type PantheonName =
  | "mortal" // == free; not stored, used for UX copy
  | "gaia"
  | "pantheon";

export const TIER_ORDER: TierId[] = ["free", "global", "enterprise"];

export const TIER_TO_PANTHEON: Record<TierId, PantheonName> = {
  free: "mortal",
  global: "gaia",
  enterprise: "pantheon",
};

export interface AccessContext {
  /** Supabase user_profiles.id — null if user never synced yet. */
  userProfileId: string | null;
  /** Active tier. Defaults to "free" when no active subscription. */
  tier: TierId;
  /** Pantheon label for UI copy. */
  pantheon: PantheonName;
  /** Raw subscription row fields that UI may want. */
  subscription: {
    id: string;
    plan: TierId;
    status: string;
    renewsAt: string | null;
    endsAt: string | null;
    email: string | null;
  } | null;
}

/** Zero-access baseline for signed-out visitors and new sign-ins. */
export const FREE_CONTEXT: AccessContext = {
  userProfileId: null,
  tier: "free",
  pantheon: "mortal",
  subscription: null,
};

/**
 * Resolve the subscription tier for a Supabase auth user id. Returns
 * FREE_CONTEXT when the user has no synced profile (shouldn't happen —
 * migration 021's trigger creates it in-transaction) or no active
 * subscription row.
 */
export async function resolveAccess(authUserId: string | null): Promise<AccessContext> {
  if (!authUserId) return FREE_CONTEXT;

  // Each query races a 2s timeout so a slow / saturated DB can't crash
  // the /account page (Next's default error boundary turns it into the
  // "SYSTEM MALFUNCTION" screen). Graceful degradation: if we can't
  // resolve the subscription, treat as free tier — the page still
  // renders with an "upgrade" CTA instead of a fatal error.
  try {
    const db = createServerClient();

    const profilePromise = db
      .from("user_profiles")
      .select("id")
      .eq("auth_id", authUserId)
      .maybeSingle();
    const profile = await raceTimeout(profilePromise, 2000, "profile");
    if (!profile || !profile.data) return FREE_CONTEXT;
    const profileId = profile.data.id as string;

    const subPromise = db
      .from("subscriptions")
      .select("id, plan, status, renews_at, ends_at, email")
      .eq("user_id", profileId)
      .in("status", ["active", "on_trial"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const subResult = await raceTimeout(subPromise, 2000, "subscription");
    const sub = subResult?.data ?? null;

    if (!sub) {
      return {
        userProfileId: profileId,
        tier: "free",
        pantheon: "mortal",
        subscription: null,
      };
    }

    const plan = (sub.plan as TierId) ?? "free";
    return {
      userProfileId: profileId,
      tier: plan,
      pantheon: TIER_TO_PANTHEON[plan] ?? "mortal",
      subscription: {
        id: sub.id as string,
        plan,
        status: sub.status as string,
        renewsAt: (sub.renews_at as string) ?? null,
        endsAt: (sub.ends_at as string) ?? null,
        email: (sub.email as string) ?? null,
      },
    };
  } catch (err) {
    console.error("[resolveAccess] falling back to FREE_CONTEXT:", err);
    return FREE_CONTEXT;
  }
}

/**
 * Race a promise against a timeout. On timeout returns null (callers
 * treat null as "query unavailable, degrade gracefully"); on rejection
 * logs and returns null. Never throws, so resolveAccess stays crash-
 * free even when Supabase is saturated.
 */
async function raceTimeout<T>(
  // Supabase query builders are thenable but not strict Promise<T>;
  // PromiseLike keeps Promise.race + await happy without an `as any`.
  p: PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), ms);
    });
    const winner = await Promise.race([Promise.resolve(p), timeout]);
    return winner as T | null;
  } catch (err) {
    console.warn(`[resolveAccess] ${label} query failed:`, err);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function tierRank(t: TierId): number {
  const i = TIER_ORDER.indexOf(t);
  return i < 0 ? 0 : i;
}

/** Does `ctx.tier` meet or exceed `minTier`? */
export function hasAtLeast(ctx: AccessContext, minTier: TierId): boolean {
  return tierRank(ctx.tier) >= tierRank(minTier);
}
