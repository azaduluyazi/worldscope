/**
 * Newsletter referral tiers — Morning Brew–style.
 *
 * Resolved client-side AND server-side. Server is authoritative for
 * gating actual rewards (private briefing, country alerts, etc.).
 */

export type ReferralTier =
  | "subscriber"
  | "analyst"
  | "operator"
  | "swag-tier"
  | "briefing-circle";

export interface TierDefinition {
  id: ReferralTier;
  threshold: number;
  label: string;
  benefit: string;
  fulfillment: "automatic" | "manual";
}

export const REFERRAL_TIERS: TierDefinition[] = [
  {
    id: "subscriber",
    threshold: 0,
    label: "Subscriber",
    benefit: "Free Sunday Convergence Report",
    fulfillment: "automatic",
  },
  {
    id: "analyst",
    threshold: 3,
    label: "Analyst",
    benefit: "Briefing archive access + Analyst badge",
    fulfillment: "automatic",
  },
  {
    id: "operator",
    threshold: 10,
    label: "Operator",
    benefit: "Custom country / topic alerts",
    fulfillment: "automatic",
  },
  {
    id: "swag-tier",
    threshold: 25,
    label: "Field Operator",
    benefit: "Branded T-shirt (manual fulfillment)",
    fulfillment: "manual",
  },
  {
    id: "briefing-circle",
    threshold: 100,
    label: "Briefing Circle",
    benefit: "Private monthly briefing call",
    fulfillment: "manual",
  },
];

export function tierForCount(count: number): TierDefinition {
  let current = REFERRAL_TIERS[0];
  for (const tier of REFERRAL_TIERS) {
    if (count >= tier.threshold) current = tier;
  }
  return current;
}

export function nextTier(count: number): TierDefinition | null {
  for (const tier of REFERRAL_TIERS) {
    if (count < tier.threshold) return tier;
  }
  return null;
}

export function progressToNext(count: number): {
  current: TierDefinition;
  next: TierDefinition | null;
  remaining: number;
  pct: number;
} {
  const current = tierForCount(count);
  const next = nextTier(count);
  if (!next) {
    return { current, next: null, remaining: 0, pct: 100 };
  }
  const span = next.threshold - current.threshold;
  const into = count - current.threshold;
  return {
    current,
    next,
    remaining: next.threshold - count,
    pct: Math.round((into / span) * 100),
  };
}

/**
 * Build a referral URL for a given referrer code.
 * Lands on /briefing with ?ref=CODE — handled in subscribe API.
 */
export function buildReferralUrl(code: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";
  return `${base}/briefing?ref=${encodeURIComponent(code)}`;
}
