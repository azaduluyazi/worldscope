/**
 * Tier ↔ Lemon Squeezy variant mapping.
 *
 * Each purchasable pantheon tier maps to one Lemon Squeezy variant id
 * stored in env. We keep variant ids in env (not code) so rotating a
 * product — or creating a test variant for staging — doesn't need a
 * redeploy. They're NEXT_PUBLIC_* because variant ids are not secret
 * (they end up in the checkout URL that the browser receives anyway).
 *
 * Billing cycles:
 *   - Monthly: variant env _GAIA          — $9/mo
 *   - Annual:  variant env _GAIA_ANNUAL   — $90/yr (~17% off, 2 months free)
 *
 * When a cycle's env var is unset we fall back to the other cycle and
 * log a warning — shipping monthly-first is fine, annual lights up the
 * moment the env is added in Vercel.
 */

import type { TierId } from "./access";

export type PurchasableTier = Exclude<TierId, "free" | "enterprise">;

/** Canonical pantheon slug used in /pricing#<slug> and API tier params.
 *  Single paid tier — "gaia" — decided 2026-04-21. Chora / Pleiades /
 *  Prometheus / Pantheon were removed to simplify the revenue model. */
export type TierSlug = "gaia";

export type BillingCycle = "monthly" | "annual";

export const TIER_TO_SLUG: Record<PurchasableTier, TierSlug> = {
  global: "gaia",
};

export const SLUG_TO_TIER: Record<TierSlug, PurchasableTier> = {
  gaia: "global",
};

/** Env var name for each (slug, cycle) pair. */
export const TIER_VARIANT_ENV: Record<TierSlug, Record<BillingCycle, string>> = {
  gaia: {
    monthly: "NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_GAIA",
    annual: "NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_GAIA_ANNUAL",
  },
};

/** Pricing copy used on /pricing and checkout flow. Kept here so the
 *  pricing page and the checkout API share the same source of truth. */
export const TIER_PRICING: Record<TierSlug, Record<BillingCycle, { price: string; unit: string; savings?: string }>> = {
  gaia: {
    monthly: { price: "$9", unit: "per month" },
    annual: { price: "$90", unit: "per year", savings: "2 months free" },
  },
};

/** Runtime env read. Works on server and client because vars are
 *  NEXT_PUBLIC_* — Next inlines them into the client bundle. */
function readEnv(name: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = (process.env as any)[name];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function getVariantId(slug: TierSlug, cycle: BillingCycle = "monthly"): string | undefined {
  return readEnv(TIER_VARIANT_ENV[slug][cycle]);
}

/** True when the tier's variant id is configured — gates the Subscribe
 *  button in the UI. */
export function isTierPurchasable(slug: TierSlug, cycle: BillingCycle = "monthly"): boolean {
  return getVariantId(slug, cycle) !== undefined;
}

export interface TierDescriptor {
  slug: TierSlug;
  tier: PurchasableTier;
  cycle: BillingCycle;
  variantId: string | undefined;
  purchasable: boolean;
  price: string;
  unit: string;
  savings?: string;
}

export function describeTier(slug: TierSlug, cycle: BillingCycle = "monthly"): TierDescriptor {
  const variantId = getVariantId(slug, cycle);
  const p = TIER_PRICING[slug][cycle];
  return {
    slug,
    tier: SLUG_TO_TIER[slug],
    cycle,
    variantId,
    purchasable: variantId !== undefined,
    price: p.price,
    unit: p.unit,
    savings: p.savings,
  };
}
