/**
 * Subscription access helpers.
 *
 * Maps the Clerk user id to a local user_profiles row, then reads
 * subscriptions to decide which tier the user is on and what features
 * they can see. Pure data layer — no UI, no redirects.
 */

import { createServerClient } from "@/lib/db/supabase";

/**
 * Tier catalogue. `briefing_country` / "chora" was designed as a $1-per-
 * country entry tier but retired 2026-04-21 — Lemon Squeezy's fixed $0.50
 * per-transaction fee makes $1 pricing uneconomical (55% effective
 * commission). The value stays in the DB CHECK constraint as a superset
 * to keep old migrations forward-compatible, but is no longer offered in
 * code.
 */
export type TierId =
  | "free"
  | "bundle5"
  | "global"
  | "pro"
  | "team"
  | "enterprise";

export type PantheonName =
  | "mortal" // == free; not stored, used for UX copy
  | "pleiades"
  | "gaia"
  | "prometheus"
  | "pantheon";

export const TIER_ORDER: TierId[] = [
  "free",
  "bundle5",
  "global",
  "pro",
  "team",
  "enterprise",
];

export const TIER_TO_PANTHEON: Record<TierId, PantheonName> = {
  free: "mortal",
  bundle5: "pleiades",
  global: "gaia",
  pro: "prometheus",
  team: "pantheon",
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
 * Resolve the subscription tier for a Clerk user id. Returns FREE_CONTEXT
 * when the user has no synced profile (webhook hasn't fired yet) or has
 * no active subscription row.
 */
export async function resolveAccess(clerkUserId: string | null): Promise<AccessContext> {
  if (!clerkUserId) return FREE_CONTEXT;
  const db = createServerClient();
  const { data: profile, error: profileErr } = await db
    .from("user_profiles")
    .select("id")
    .eq("auth_id", clerkUserId)
    .maybeSingle();
  if (profileErr || !profile) return FREE_CONTEXT;

  const { data: sub } = await db
    .from("subscriptions")
    .select("id, plan, status, renews_at, ends_at, email")
    .eq("user_id", profile.id)
    .in("status", ["active", "on_trial"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) {
    return {
      userProfileId: profile.id as string,
      tier: "free",
      pantheon: "mortal",
      subscription: null,
    };
  }

  const plan = (sub.plan as TierId) ?? "free";
  return {
    userProfileId: profile.id as string,
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
}

export function tierRank(t: TierId): number {
  const i = TIER_ORDER.indexOf(t);
  return i < 0 ? 0 : i;
}

/** Does `ctx.tier` meet or exceed `minTier`? */
export function hasAtLeast(ctx: AccessContext, minTier: TierId): boolean {
  return tierRank(ctx.tier) >= tierRank(minTier);
}
