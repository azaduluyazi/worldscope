import type { Category, Severity } from "@/types/intel";

// ── Convergence Types ──────────────────────────────────

export type ConvergenceType =
  | "geopolitical"        // conflict + diplomacy/energy/finance
  | "economic_cascade"    // energy + finance + trade
  | "cyber_infrastructure"// cyber + energy/finance
  | "humanitarian"        // conflict/natural + health
  | "environmental"       // natural + energy + health
  | "multi_signal";       // 3+ categories, no specific pattern

export type SignalRole = "trigger" | "consequence" | "reaction";

export interface ConvergenceSignal {
  sourceId: string;
  eventId: string;
  category: Category;
  severity: Severity;
  reliability: number;
  role: SignalRole;
  title: string;
  lat?: number;
  lng?: number;
  publishedAt: string;
}

export interface ImpactLink {
  from: Category;
  to: Category;
  confidence: number;
  description: string;
}

/**
 * Forward prediction surfaced to UI consumers. Mirrors the
 * PredictedFollowup shape from forward-prediction.ts but lives here
 * so consumers don't need to import the engine package.
 */
export interface ConvergencePrediction {
  predictedCategory: Category;
  probability: number;
  expectedWindowMs: number;
  reasoning: string;
  triggerEventId: string;
  generatedAt: string;
  expiresAt: string;
  /** Set after validatePredictions runs in the next cycle */
  validated?: boolean;
  /** Set when a real event matched this prediction */
  matchedEventId?: string;
}

export interface Convergence {
  id: string;
  type: ConvergenceType;
  confidence: number;
  signals: ConvergenceSignal[];
  impactChain: ImpactLink[];
  narrative?: string;
  timeline: { start: string; end: string };
  location: { lat: number; lng: number };
  affectedRegions: string[];
  createdAt: string;
  expiresAt: string;
  /**
   * Forward predictions generated from the trigger event of this
   * convergence. Populated by the engine when the convergence is built.
   * Empty array if no high-confidence rules apply.
   */
  predictions?: ConvergencePrediction[];
  /**
   * Storyline this convergence belongs to (if any). Set after the
   * engine attaches the convergence to a storyline.
   */
  storylineId?: string;
  /**
   * True when this convergence was produced by the topic-detector
   * track (geo-sparse events clustered by semantic similarity +
   * category + time window) instead of the geographic Haversine
   * track. UI should skip location display and show a TOPIC badge
   * instead of coordinates. `location` will be {0, 0} sentinel.
   */
  isTopicCluster?: boolean;
}

export interface ConvergenceResponse {
  convergences: Convergence[];
  metadata: {
    totalSignalsAnalyzed: number;
    convergencesFound: number;
    timestamp: string;
  };
  /**
   * Per-track observability counters collected during this scan.
   * The cron route persists these into the convergence_metrics table
   * so operators can answer "why did we produce 0 clusters?" with a
   * single SQL query instead of reading code.
   *
   * Undefined for older callers that don't yet pipe this through
   * (backward-compatible).
   */
  trackMetrics?: Array<{
    track: "geo" | "topic";
    cycleTimestamp: string;
    eventsInput: number;
    clustersProduced: number;
    durationMs: number;
    failureReason: string | null;
    // Topic-specific (undefined for geo rows)
    eventsWithEmbedding?: number;
    eventsSkippedNoEmbedding?: number;
    clustersDroppedMinSize?: number;
    clustersDroppedSingleCategory?: number;
    // Geo-specific (undefined for topic rows)
    geoClustersFound?: number;
    temporalGroupsFound?: number;
  }>;
}

// ── Source Reliability ──────────────────────────────────

export interface SourceReliability {
  sourceId: string;
  baseScore: number;      // 0.0-1.0 static
  dynamicScore: number;   // after gateway modifier
  tier: 1 | 2 | 3 | 4;
}

// ── Correlation ────────────────────────────────────────

export interface GeoCluster {
  centroid: { lat: number; lng: number };
  events: ClusterEvent[];
  radius: number;         // km
}

export interface ClusterEvent {
  eventId: string;
  sourceId: string;
  category: Category;
  severity: Severity;
  reliability: number;
  /**
   * Source reliability tier (1 = institutional/wire, 2 = major editorial,
   * 3 = specialized/HN, 4 = community/social/RSS). Used by the Bayesian
   * scorer's tier diversity bonus to reward heterogeneous agreement
   * (T1+T4 match is stronger evidence than T1+T1 match because the two
   * tiers represent independent epistemic populations).
   * Optional for backward compatibility — old call sites default to T3.
   */
  tier?: 1 | 2 | 3 | 4;
  title: string;
  lat: number;
  lng: number;
  publishedAt: string;
}
