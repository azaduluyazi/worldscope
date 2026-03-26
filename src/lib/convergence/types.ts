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
}

export interface ConvergenceResponse {
  convergences: Convergence[];
  metadata: {
    totalSignalsAnalyzed: number;
    convergencesFound: number;
    timestamp: string;
  };
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
  title: string;
  lat: number;
  lng: number;
  publishedAt: string;
}
