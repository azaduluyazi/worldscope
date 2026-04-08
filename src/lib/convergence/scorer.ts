import type { Severity } from "@/types/intel";
import type { ClusterEvent, ImpactLink } from "./types";
import { bayesianConfidence, type BayesianOptions } from "./bayesian-scorer";

// ═══════════════════════════════════════════════════════════════════
//  Convergence Scorer (v2 — Bayesian)
// ═══════════════════════════════════════════════════════════════════
//
//  This module is now a THIN WRAPPER around bayesian-scorer.ts.
//  All real math lives there. We keep this file's exports stable so
//  engine.ts and tests don't need to change shape.
//
//  v1 → v2 migration:
//  ------------------
//    OLD: weighted_avg(reliability × severity) × chainBonus + diversity
//    NEW: bayesian_log_odds_accumulation with:
//          • prior belief
//          • per-event log-likelihood ratios
//          • temporal decay (fresh signals weigh more)
//          • syndication dampening (wire reprints don't double-count)
//          • chain bonus as movement multiplier (not raw multiplier)
//
//  Role assignment (trigger/consequence/reaction) logic is unchanged.
//
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate convergence confidence using Bayesian belief accumulation.
 *
 * Replaces the v1 linear-average approach. See bayesian-scorer.ts for
 * the full math. Returns a number in [0, 1].
 *
 * v3.1: accepts optional baseline surprise and prior override for
 * per-cluster calibration. Both default to neutral values that
 * preserve v3 behavior when not provided.
 */
export function calculateConvergenceConfidence(
  events: ClusterEvent[],
  impactLinks: ImpactLink[],
  options: BayesianOptions = {}
): number {
  return bayesianConfidence(events, impactLinks, options);
}

/**
 * Assign roles to signals within a convergence.
 *
 * trigger: earliest event OR highest severity
 * consequence: events in categories that follow from trigger's category
 * reaction: everything else
 *
 * Unchanged from v1.
 */
export function assignSignalRoles(
  events: ClusterEvent[],
  impactLinks: ImpactLink[]
): Map<string, "trigger" | "consequence" | "reaction"> {
  const roles = new Map<string, "trigger" | "consequence" | "reaction">();

  if (events.length === 0) return roles;

  // Sort by time, then severity
  const sorted = [...events].sort((a, b) => {
    const timeDiff = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    if (Math.abs(timeDiff) > 15 * 60 * 1000) return timeDiff; // >15min apart = time matters
    // Within 15min, higher severity = more likely trigger
    const sevOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });

  // First event = trigger
  const trigger = sorted[0];
  roles.set(trigger.eventId, "trigger");

  // Build "from" categories set from impact links where trigger category is source
  const consequenceCategories = new Set(
    impactLinks
      .filter((l) => l.from === trigger.category)
      .map((l) => l.to)
  );

  // Assign rest
  for (let i = 1; i < sorted.length; i++) {
    const event = sorted[i];
    if (consequenceCategories.has(event.category)) {
      roles.set(event.eventId, "consequence");
    } else {
      roles.set(event.eventId, "reaction");
    }
  }

  return roles;
}
