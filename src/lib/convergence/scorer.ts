import type { Severity } from "@/types/intel";
import type { ClusterEvent } from "./types";
import type { ImpactLink } from "./types";
import { getChainBonus } from "./impact-chain";

// ── Severity weights for convergence scoring ───────────

const SEVERITY_MULTIPLIER: Record<Severity, number> = {
  critical: 1.0,
  high: 0.8,
  medium: 0.5,
  low: 0.25,
  info: 0.1,
};

/**
 * Calculate convergence confidence score.
 *
 * Formula:
 *   base = weightedAvg(signal_reliability × severity_weight)
 *   diversity_bonus = log2(unique_categories) × 0.1
 *   chain_bonus = from impact chain (1.0 - 1.3)
 *   confidence = min(1.0, base × chain_bonus + diversity_bonus)
 *
 * Signals with higher reliability and severity contribute more.
 * More diverse categories = slightly higher confidence.
 * Impact chain presence = multiplicative bonus.
 */
export function calculateConvergenceConfidence(
  events: ClusterEvent[],
  impactLinks: ImpactLink[]
): number {
  if (events.length < 2) return 0;

  // Weighted average: reliability × severity_weight
  let totalWeight = 0;
  let weightedSum = 0;

  for (const event of events) {
    const sevWeight = SEVERITY_MULTIPLIER[event.severity];
    const signalStrength = event.reliability * sevWeight;
    weightedSum += signalStrength;
    totalWeight += 1;
  }

  const base = weightedSum / totalWeight;

  // Category diversity bonus
  const uniqueCategories = new Set(events.map((e) => e.category)).size;
  const diversityBonus = Math.log2(Math.max(uniqueCategories, 1)) * 0.1;

  // Impact chain bonus (1.0 to 1.3)
  const chainBonus = getChainBonus(impactLinks);

  // Final confidence
  const confidence = Math.min(1.0, base * chainBonus + diversityBonus);

  return Math.round(confidence * 100) / 100;
}

/**
 * Assign roles to signals within a convergence.
 *
 * trigger: earliest event OR highest severity
 * consequence: events in categories that follow from trigger's category
 * reaction: everything else (markets, diplomacy responses)
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
