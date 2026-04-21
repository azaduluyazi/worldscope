/**
 * Tier ↔ Lemon Squeezy variant mapping.
 *
 * Each purchasable pantheon tier maps to one Lemon Squeezy variant id
 * stored in env. We keep variant ids in env (not code) so rotating a
 * product — or creating a test variant for staging — doesn't need a
 * redeploy. They're NEXT_PUBLIC_* because variant ids are not secret
 * (they end up in the checkout URL that the browser receives anyway).
 *
 * When a tier's env var is unset we treat the tier as "not-yet-available"
 * — the UI shows a "Coming Soon" badge instead of a Subscribe button, so
 * shipping one tier at a time is safe.
 */

import type { TierId } from "./access";

export type PurchasableTier = Exclude<TierId, "free" | "enterprise">;

/** Canonical pantheon slugs used in /pricing#<slug> and API tier params. */
export type TierSlug =
  | "chora"
  | "pleiades"
  | "gaia"
  | "prometheus"
  | "pantheon";

/** DB tier id -> public pantheon slug used in URLs and checkout payloads. */
export const TIER_TO_SLUG: Record<PurchasableTier, TierSlug> = {
  briefing_country: "chora",
  bundle5: "pleiades",
  global: "gaia",
  pro: "prometheus",
  team: "pantheon",
};

/** Reverse lookup for the checkout route. */
export const SLUG_TO_TIER: Record<TierSlug, PurchasableTier> = {
  chora: "briefing_country",
  pleiades: "bundle5",
  gaia: "global",
  prometheus: "pro",
  pantheon: "team",
};

/** Env var names — kept in one place so onboarding docs can link here. */
export const TIER_VARIANT_ENV: Record<TierSlug, string> = {
  chora: "NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_CHORA",
  pleiades: "NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_PLEIADES",
  gaia: "NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_GAIA",
  prometheus: "NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_PROMETHEUS",
  pantheon: "NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_PANTHEON",
};

/** Runtime env read. Works on server and client because vars are
 *  NEXT_PUBLIC_* — Next inlines them into the client bundle. */
function readEnv(name: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = (process.env as any)[name];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function getVariantId(slug: TierSlug): string | undefined {
  return readEnv(TIER_VARIANT_ENV[slug]);
}

/** True when the tier's variant id is configured — gates the Subscribe
 *  button in the UI. */
export function isTierPurchasable(slug: TierSlug): boolean {
  return getVariantId(slug) !== undefined;
}

export interface TierDescriptor {
  slug: TierSlug;
  tier: PurchasableTier;
  variantId: string | undefined;
  purchasable: boolean;
}

export function describeTier(slug: TierSlug): TierDescriptor {
  const variantId = getVariantId(slug);
  return {
    slug,
    tier: SLUG_TO_TIER[slug],
    variantId,
    purchasable: variantId !== undefined,
  };
}
