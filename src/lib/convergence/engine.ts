import type { IntelItem, Category } from "@/types/intel";
import type { Convergence, ConvergenceSignal, ConvergenceResponse } from "./types";
import { detectCorrelations, checkEventCorrelation, type CorrelationGroup } from "./correlation-detector";
import { resolveImpactChain, classifyConvergence } from "./impact-chain";
import { calculateConvergenceConfidence, assignSignalRoles } from "./scorer";
import { batchGenerateNarratives } from "./narrative";

// ── Country code inference from coordinates ────────────

function inferRegions(lat: number, lng: number): string[] {
  // Simplified region inference from coordinates
  const regions: string[] = [];

  if (lat >= 25 && lat <= 42 && lng >= 25 && lng <= 60) regions.push("ME"); // Middle East
  if (lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40) regions.push("EU"); // Europe
  if (lat >= 25 && lat <= 50 && lng >= -130 && lng <= -60) regions.push("NA"); // North America
  if (lat >= -10 && lat <= 55 && lng >= 60 && lng <= 150) regions.push("AS"); // Asia
  if (lat >= -35 && lat <= 37 && lng >= -20 && lng <= 55) regions.push("AF"); // Africa
  if (lat >= -55 && lat <= 15 && lng >= -80 && lng <= -35) regions.push("SA"); // South America

  return regions.length > 0 ? regions : ["GLOBAL"];
}

// ── Convergence ID generator ───────────────────────────

let convergenceCounter = 0;

function generateId(): string {
  convergenceCounter++;
  const date = new Date().toISOString().slice(0, 10);
  return `conv-${date}-${String(convergenceCounter).padStart(3, "0")}`;
}

// ── Build Convergence from Correlation Group ───────────

function buildConvergence(group: CorrelationGroup): Omit<Convergence, "narrative"> {
  const categories = group.categories as Category[];
  const impactChain = resolveImpactChain(categories);
  const confidence = calculateConvergenceConfidence(group.events, impactChain);
  const roles = assignSignalRoles(group.events, impactChain);
  const type = classifyConvergence(categories);

  const signals: ConvergenceSignal[] = group.events.map((event) => ({
    sourceId: event.sourceId,
    eventId: event.eventId,
    category: event.category,
    severity: event.severity,
    reliability: event.reliability,
    role: roles.get(event.eventId) || "reaction",
    title: event.title,
    lat: event.lat,
    lng: event.lng,
    publishedAt: event.publishedAt,
  }));

  const regions = inferRegions(group.centroid.lat, group.centroid.lng);
  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

  return {
    id: generateId(),
    type,
    confidence,
    signals,
    impactChain,
    timeline: group.timeSpan,
    location: group.centroid,
    affectedRegions: regions,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
}

// ── Main Engine Functions ──────────────────────────────

/**
 * Full convergence scan — called by cron every 5 minutes.
 * Processes all recent events and generates convergences with narratives.
 */
export async function runFullConvergenceScan(
  items: IntelItem[],
  hoursBack = 6
): Promise<ConvergenceResponse> {
  // Reset counter per scan
  convergenceCounter = 0;

  // Step 1: Detect correlations
  const correlations = detectCorrelations(items, hoursBack);

  if (correlations.length === 0) {
    return {
      convergences: [],
      metadata: {
        totalSignalsAnalyzed: items.length,
        convergencesFound: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Step 2: Build convergence objects (without narrative)
  const rawConvergences = correlations.map(buildConvergence);

  // Step 3: Filter to minimum confidence threshold
  const MIN_CONFIDENCE = 0.4;
  const filtered = rawConvergences.filter((c) => c.confidence >= MIN_CONFIDENCE);

  // Step 4: Generate LLM narratives for high-confidence convergences
  const narratives = await batchGenerateNarratives(filtered, 0.7);

  // Step 5: Merge narratives
  const convergences: Convergence[] = filtered.map((c) => ({
    ...c,
    narrative: narratives.get(c.id),
  }));

  return {
    convergences: convergences.sort((a, b) => b.confidence - a.confidence),
    metadata: {
      totalSignalsAnalyzed: items.length,
      convergencesFound: convergences.length,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Quick convergence check — called instantly when a critical/high event arrives.
 * Does NOT generate LLM narrative (too slow for instant path).
 */
export function runInstantCheck(
  newEvent: IntelItem,
  recentEvents: IntelItem[]
): Convergence | null {
  const correlation = checkEventCorrelation(newEvent, recentEvents);
  if (!correlation) return null;

  const raw = buildConvergence(correlation);

  // Only return if confidence is meaningful
  if (raw.confidence < 0.5) return null;

  return { ...raw, narrative: undefined };
}
