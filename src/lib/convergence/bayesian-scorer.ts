import type { Severity } from "@/types/intel";
import type { ClusterEvent, ImpactLink } from "./types";
import { getChainBonus } from "./impact-chain";
import { computeEffectiveSignalCount } from "./source-syndication";
import { temporalDecayWeightFloored } from "./temporal-decay";

// ═══════════════════════════════════════════════════════════════════
//  Bayesian Confidence Scorer
// ═══════════════════════════════════════════════════════════════════
//
//  PROBLEM v1 scorer had:
//  ----------------------
//    confidence = avg(reliability × severity) × chainBonus + diversity
//
//  This LINEAR average has three problems:
//
//  1. EVIDENCE DOESN'T ACCUMULATE. Five strong signals get the same
//     score as one strong signal. That's not how belief works — each
//     additional signal should INCREASE confidence (asymptotically).
//
//  2. ONE WEAK SIGNAL DRAGS DOWN STRONG ONES. A reliability=0.45 RSS
//     mention pulls a Reuters reliability=0.95 confirmation down.
//     That's backwards: weak signals shouldn't lower strong ones,
//     they just shouldn't lift them as much.
//
//  3. CORRELATED SOURCES INFLATE THE COUNT. v1 didn't dampen wire
//     reprints, so 5 Reuters re-runs counted as 5 signals.
//
//  SOLUTION (this file):
//  ---------------------
//  Bayesian belief update in log-odds space:
//
//    1. Start with a prior: log_odds = ln(prior / (1 - prior))
//       prior = 0.30 means "30% baseline belief that any given multi-
//       signal cluster represents a real convergence event".
//
//    2. For each event, compute its EVIDENCE STRENGTH:
//         likelihood = reliability × severity_weight × decay_weight
//
//       Then convert to a log-likelihood ratio:
//         llr = ln((likelihood + ε) / (1 - likelihood + ε))
//
//       Add it to the running log_odds.
//
//    3. APPLY SYNDICATION DAMPENING by scaling each event's
//       contribution by 1/group_size_weight (computed via the
//       syndication module).
//
//    4. Multiply the final log-odds by the chain bonus (causal
//     coherence amplifies belief).
//
//    5. Convert back to probability with sigmoid:
//         confidence = 1 / (1 + exp(-log_odds))
//
//  RESULT:
//    - Multiple strong signals push confidence asymptotically to 1.0
//    - Weak signals lift slightly, never drag down
//    - Wire reprints don't double-count
//    - Fresh signals weigh more than stale ones
//
// ═══════════════════════════════════════════════════════════════════

// ── Tunable parameters ──────────────────────────────────────────

/**
 * Bayesian prior. The baseline belief that a random multi-signal
 * cluster (>=2 events, multiple categories) represents a real
 * convergence event.
 *
 * 0.30 = "balanced" — middle of the analyst-vs-journalist spectrum.
 *   Lower (0.10) = conservative, fewer high-confidence convergences
 *   Higher (0.50) = aggressive, more dashboard activity
 *
 * Tune this once telemetry data is available (Phase 6).
 */
export const BAYESIAN_PRIOR = 0.30;

const SEVERITY_LIKELIHOOD: Record<Severity, number> = {
  critical: 0.95,
  high:     0.80,
  medium:   0.60,
  low:      0.40,
  info:     0.25,
};

const EPSILON = 0.01;

// ── Core math ────────────────────────────────────────────────────

/**
 * Convert a probability to log-odds.
 *   p = 0.5 → 0
 *   p = 0.9 → +2.20
 *   p = 0.1 → −2.20
 */
function logOdds(p: number): number {
  const clamped = Math.max(EPSILON, Math.min(1 - EPSILON, p));
  return Math.log(clamped / (1 - clamped));
}

/**
 * Convert log-odds back to probability via sigmoid.
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Optional inputs that modify the Bayesian scoring behavior.
 *
 *   - surpriseMultiplier: from baseline.ts, amplifies anomalous
 *     co-occurrences. 1.0 = normal (no effect), >1.0 = rare pattern
 *     (boost), clamped to 4.0 upstream.
 *   - priorOverride: runtime-calibrated prior from the telemetry
 *     calibration loop. Defaults to BAYESIAN_PRIOR.
 */
export interface BayesianOptions {
  surpriseMultiplier?: number;
  priorOverride?: number;
  now?: number;
}

/**
 * Compute Bayesian confidence for a cluster of correlated events.
 *
 * @param events       cluster events (already filtered for geo+time+category)
 * @param impactLinks  causal links found via impact-chain.ts
 * @param options      optional baseline surprise + calibrated prior
 */
export function bayesianConfidence(
  events: ClusterEvent[],
  impactLinks: ImpactLink[],
  options: BayesianOptions = {}
): number {
  if (events.length < 2) return 0;

  const now = options.now ?? Date.now();
  const prior = options.priorOverride ?? BAYESIAN_PRIOR;
  const surprise = options.surpriseMultiplier ?? 1.0;

  // ── Step 1: prior belief ────────────────────────────────────
  let logOddsValue = logOdds(prior);

  // ── Step 2: per-event evidence accumulation ────────────────
  const effectiveCount = computeEffectiveSignalCount(events);
  const syndicationScale = effectiveCount / events.length;

  for (const event of events) {
    const decay = temporalDecayWeightFloored(
      event.publishedAt,
      event.category,
      event.severity,
      0.05,
      now
    );
    const sevLikelihood = SEVERITY_LIKELIHOOD[event.severity];
    const likelihood = event.reliability * sevLikelihood * decay;
    const llr = logOdds(likelihood);
    logOddsValue += llr * syndicationScale;
  }

  // ── Step 3: causal chain bonus (multiplicative on belief) ───
  const priorLogOdds = logOdds(prior);
  const chainBonus = getChainBonus(impactLinks);
  const movement = logOddsValue - priorLogOdds;
  logOddsValue = priorLogOdds + movement * chainBonus;

  // ── Step 4: baseline surprise multiplier ────────────────────
  // Boring co-occurrences (e.g. NY market open → tech+finance every
  // day) have surprise near 1.0 → no change. Rare patterns (e.g.
  // tech+finance in Africa at 3am) have surprise 2.0+ → belief boost.
  // Applied to the log-odds movement so we don't push past sigmoid
  // saturation.
  if (surprise !== 1.0) {
    const updatedMovement = logOddsValue - priorLogOdds;
    logOddsValue = priorLogOdds + updatedMovement * surprise;
  }

  // ── Step 5: convert back to probability ─────────────────────
  const confidence = sigmoid(logOddsValue);

  return Math.round(confidence * 100) / 100;
}

/**
 * Diagnostic breakdown of how a confidence score was computed.
 * Used by the debug UI to explain to users WHY a convergence scored
 * the way it did. Critical for trust in the system.
 */
export interface BayesianBreakdown {
  prior: number;
  priorLogOdds: number;
  rawSignalCount: number;
  effectiveSignalCount: number;
  syndicationScale: number;
  perEventContributions: {
    eventId: string;
    sourceId: string;
    likelihood: number;
    decayWeight: number;
    llr: number;
    contribution: number;
  }[];
  chainBonus: number;
  finalLogOdds: number;
  finalConfidence: number;
}

export function explainBayesian(
  events: ClusterEvent[],
  impactLinks: ImpactLink[],
  options: BayesianOptions = {}
): BayesianBreakdown {
  const now = options.now ?? Date.now();
  const prior = options.priorOverride ?? BAYESIAN_PRIOR;
  const surprise = options.surpriseMultiplier ?? 1.0;

  const priorLogOdds = logOdds(prior);
  let logOddsValue = priorLogOdds;
  const effectiveCount = computeEffectiveSignalCount(events);
  const syndicationScale = events.length === 0 ? 1 : effectiveCount / events.length;

  const perEvent = events.map((event) => {
    const decay = temporalDecayWeightFloored(
      event.publishedAt,
      event.category,
      event.severity,
      0.05,
      now
    );
    const sevLikelihood = SEVERITY_LIKELIHOOD[event.severity];
    const likelihood = event.reliability * sevLikelihood * decay;
    const llr = logOdds(likelihood);
    const contribution = llr * syndicationScale;
    logOddsValue += contribution;
    return {
      eventId: event.eventId,
      sourceId: event.sourceId,
      likelihood,
      decayWeight: decay,
      llr,
      contribution,
    };
  });

  const chainBonus = getChainBonus(impactLinks);
  const movement = logOddsValue - priorLogOdds;
  logOddsValue = priorLogOdds + movement * chainBonus;

  if (surprise !== 1.0) {
    const updatedMovement = logOddsValue - priorLogOdds;
    logOddsValue = priorLogOdds + updatedMovement * surprise;
  }

  return {
    prior,
    priorLogOdds,
    rawSignalCount: events.length,
    effectiveSignalCount: effectiveCount,
    syndicationScale,
    perEventContributions: perEvent,
    chainBonus,
    finalLogOdds: logOddsValue,
    finalConfidence: Math.round(sigmoid(logOddsValue) * 100) / 100,
  };
}
