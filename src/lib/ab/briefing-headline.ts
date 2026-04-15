/**
 * A/B test config — /briefing page headline variants.
 *
 * Assignment:
 *  - Middleware sets a `briefing_v` cookie with the variant id on first visit
 *  - Cookie persists 90 days
 *  - Page reads cookie server-side via next/headers
 *  - If cookie missing (e.g. curl, bot), defaults to "control"
 *
 * Analytics:
 *  - Plausible custom event `briefing_view` with variant prop (fired
 *    from the client component wrapping the headline)
 *  - Conversion is `briefing_subscribe` on successful subscribe
 *
 * To add/remove variants, just edit BRIEFING_VARIANTS and redeploy.
 * Weights must sum to 100.
 */

export const BRIEFING_COOKIE = "briefing_v";
export const BRIEFING_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export interface BriefingVariant {
  id: string;
  weight: number; // sum to 100
  eyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  lede: string;
  cta: string;
}

export const BRIEFING_VARIANTS: BriefingVariant[] = [
  {
    id: "control",
    weight: 34,
    eyebrow: "INTELLIGENCE BRIEFING · EST. 2026",
    headlineLine1: "The Sunday",
    headlineLine2: "Convergence Report",
    lede: "One PDF, every Sunday, 7:00 UTC. AI-curated signals from 689 sources across 195 countries. The stories that matter before they hit the wire.",
    cta: "GET IT SUNDAY",
  },
  {
    id: "before-wire",
    weight: 33,
    eyebrow: "WEEKLY INTELLIGENCE · FREE",
    headlineLine1: "The signal,",
    headlineLine2: "before the wire",
    lede: "689 sources. 195 countries. One AI-curated PDF every Sunday at 07:00 UTC. Used by analysts, traders and journalists who can't wait for Reuters to catch up.",
    cta: "SEND ME THE NEXT ONE",
  },
  {
    id: "what-desks-miss",
    weight: 33,
    eyebrow: "CONVERGENCE INTELLIGENCE · SUNDAY",
    headlineLine1: "What every desk",
    headlineLine2: "will miss this week",
    lede: "Our convergence engine watches 689 sources in 30 languages and ships a weekly PDF with the cross-verified signals most newsrooms don't catch until Tuesday. Free.",
    cta: "SHIP IT TO ME SUNDAY",
  },
];

/**
 * Pick a variant id by weight. Deterministic with seed for testing;
 * random otherwise. Used by middleware on first visit.
 */
export function pickVariant(seed?: number): string {
  const r = seed != null ? seed : Math.random() * 100;
  let acc = 0;
  for (const v of BRIEFING_VARIANTS) {
    acc += v.weight;
    if (r < acc) return v.id;
  }
  return BRIEFING_VARIANTS[0].id;
}

export function getVariant(id: string | undefined): BriefingVariant {
  const match = BRIEFING_VARIANTS.find((v) => v.id === id);
  return match || BRIEFING_VARIANTS[0];
}
