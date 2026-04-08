import type { Convergence } from "./types";

// ═══════════════════════════════════════════════════════════════════
//  Storyline Tracker — Long-Lived Narrative Layer
// ═══════════════════════════════════════════════════════════════════
//
//  PROBLEM v1 had:
//  ---------------
//  Every convergence expired after a hardcoded 6 hours. But real-world
//  events (war in Ukraine, ongoing pandemic, multi-week protests) span
//  days or months. Without a longer-lived layer, the UI shows the same
//  story re-fragmented every 6 hours and the briefing email spams users
//  with "NEW: Russia-Ukraine convergence!" multiple times per day.
//
//  SOLUTION (decision: confidence-adaptive C with activity twist):
//  ---------------------------------------------------------------
//  Two-layer model:
//
//    Storyline (this file)
//      ├── snapshot 1 (Convergence, 6h life)
//      ├── snapshot 2 (Convergence, 6h life)
//      └── snapshot N
//
//  When a new Convergence comes in:
//    1. Find the best matching ACTIVE storyline (geo + category + time)
//    2. If match → attach as new snapshot, REFRESH ttl
//    3. If no match → create new storyline
//
//  TTL math:
//    base_ttl = ttlByConfidence(maxConfidence)
//      0.85+ → 14 days
//      0.65+ → 7 days
//      0.45+ → 3 days
//      <0.45 → 24 hours
//
//    Each new snapshot extends ttl by 50% of base, capped at 2x base.
//    So an active high-confidence storyline can live ≥ 28 days while
//    refreshing.
//
//  STORAGE: this module is pure logic. Persistence happens in the
//  engine layer (Supabase storylines table — see Phase 7).
//
// ═══════════════════════════════════════════════════════════════════

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/**
 * Maximum snapshots kept per storyline. Older snapshots are trimmed
 * from the head of the array. This prevents JSONB bloat on long-lived
 * storylines (e.g. a multi-week war narrative).
 *
 * With 2 snapshots/day, 50 covers ~25 days of activity. Older
 * snapshots are still visible in `convergence_history` via the
 * `storyline_id` backreference.
 */
export const MAX_STORYLINE_SNAPSHOTS = 50;

export interface Storyline {
  id: string;
  /** Inferred storyline type (from latest snapshot) */
  type: string;
  /** Highest confidence ever observed across snapshots */
  peakConfidence: number;
  /** All convergence snapshots, oldest first */
  snapshots: Convergence[];
  /** Centroid of all snapshot locations (running average) */
  centroid: { lat: number; lng: number };
  /** Union of categories across all snapshots */
  categories: string[];
  /** Union of regions across all snapshots */
  affectedRegions: string[];
  /** When this storyline was first seen */
  createdAt: string;
  /** When the most recent snapshot was added */
  lastActivityAt: string;
  /** When this storyline should be archived */
  expiresAt: string;
  /** Headline for UI — taken from highest-confidence snapshot */
  headline: string;
}

// ── TTL math ──────────────────────────────────────────────────

export function ttlByConfidence(confidence: number): number {
  if (confidence >= 0.85) return 14 * DAY;
  if (confidence >= 0.65) return 7 * DAY;
  if (confidence >= 0.45) return 3 * DAY;
  return 24 * HOUR;
}

/**
 * Compute the new expiry timestamp for a storyline given its peak
 * confidence and current activity. Each refresh extends the TTL by
 * 50% of base, capped at 2x base.
 */
export function computeExpiry(
  peakConfidence: number,
  snapshotCount: number,
  baseTime: number = Date.now()
): string {
  const base = ttlByConfidence(peakConfidence);
  const refreshes = Math.max(0, snapshotCount - 1);
  const extension = Math.min(base, refreshes * base * 0.5);
  return new Date(baseTime + base + extension).toISOString();
}

// ── Matching: does a new convergence belong to an existing storyline? ─

const MATCH_GEO_RADIUS_KM = 800; // generous — storylines span regions
const MATCH_CATEGORY_OVERLAP = 0.5; // at least half of categories must match

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function categoryOverlap(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const c of setA) if (setB.has(c)) inter++;
  return inter / Math.max(setA.size, setB.size);
}

/**
 * Score how well a Convergence fits an existing Storyline.
 * Returns 0 (no match) to 1 (perfect match).
 */
export function matchScore(conv: Convergence, story: Storyline, now: number = Date.now()): number {
  // Don't match expired storylines
  if (new Date(story.expiresAt).getTime() < now) return 0;

  // Geographic proximity
  const dist = haversineKm(conv.location, story.centroid);
  if (dist > MATCH_GEO_RADIUS_KM) return 0;
  const geoScore = 1 - dist / MATCH_GEO_RADIUS_KM;

  // Category overlap
  const convCats = conv.signals.map((s) => s.category);
  const overlap = categoryOverlap(convCats, story.categories);
  if (overlap < MATCH_CATEGORY_OVERLAP) return 0;

  // Recency weight — prefer recently-active storylines
  const ageMs = now - new Date(story.lastActivityAt).getTime();
  const recencyScore = Math.exp(-ageMs / (3 * DAY));

  // Combined score (geometric mean — all dimensions must agree)
  return Math.cbrt(geoScore * overlap * recencyScore);
}

// ── Public API: attach or create ───────────────────────────────────

/**
 * Try to attach a new convergence to the best-matching storyline.
 * Returns either the updated storyline or `null` if no match was
 * found (caller should create a new storyline).
 */
export function attachToStoryline(
  conv: Convergence,
  candidates: Storyline[],
  now: number = Date.now()
): { story: Storyline; score: number } | null {
  if (candidates.length === 0) return null;
  const scored = candidates.map((s) => ({ story: s, score: matchScore(conv, s, now) }));
  const best = scored.sort((a, b) => b.score - a.score)[0];
  if (best.score < 0.3) return null;
  // Mutate-style update — caller persists
  const updated = mergeSnapshot(best.story, conv, now);
  return { story: updated, score: best.score };
}

function mergeSnapshot(story: Storyline, conv: Convergence, now: number): Storyline {
  // Cap snapshots at MAX_STORYLINE_SNAPSHOTS — trim the oldest so the
  // JSONB array stays bounded. The full history remains accessible
  // via convergence_history.storyline_id.
  const merged = [...story.snapshots, conv];
  const snapshots =
    merged.length > MAX_STORYLINE_SNAPSHOTS
      ? merged.slice(merged.length - MAX_STORYLINE_SNAPSHOTS)
      : merged;
  const peakConfidence = Math.max(story.peakConfidence, conv.confidence);

  // Update centroid (running average across all snapshots)
  const n = snapshots.length;
  const centroid = {
    lat: (story.centroid.lat * (n - 1) + conv.location.lat) / n,
    lng: (story.centroid.lng * (n - 1) + conv.location.lng) / n,
  };

  // Union categories and regions
  const categories = Array.from(
    new Set([...story.categories, ...conv.signals.map((s) => s.category)])
  );
  const affectedRegions = Array.from(
    new Set([...story.affectedRegions, ...conv.affectedRegions])
  );

  // Headline = highest-confidence snapshot's narrative or first signal title
  const topSnapshot = snapshots.reduce((a, b) => (a.confidence >= b.confidence ? a : b));
  const headline =
    topSnapshot.narrative?.split("\n")[0] ?? topSnapshot.signals[0]?.title ?? story.headline;

  return {
    ...story,
    snapshots,
    peakConfidence,
    centroid,
    categories,
    affectedRegions,
    lastActivityAt: new Date(now).toISOString(),
    expiresAt: computeExpiry(peakConfidence, snapshots.length, now),
    headline,
  };
}

/**
 * Create a fresh storyline from a convergence (no existing match).
 */
export function createStoryline(
  conv: Convergence,
  now: number = Date.now()
): Storyline {
  return {
    id: `story-${new Date(now).toISOString().slice(0, 10)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    type: conv.type,
    peakConfidence: conv.confidence,
    snapshots: [conv],
    centroid: { ...conv.location },
    categories: Array.from(new Set(conv.signals.map((s) => s.category))),
    affectedRegions: [...conv.affectedRegions],
    createdAt: new Date(now).toISOString(),
    lastActivityAt: new Date(now).toISOString(),
    expiresAt: computeExpiry(conv.confidence, 1, now),
    headline: conv.narrative?.split("\n")[0] ?? conv.signals[0]?.title ?? "Untitled storyline",
  };
}

/**
 * Filter storylines to only those that haven't expired yet.
 */
export function activeStorylines(stories: Storyline[], now: number = Date.now()): Storyline[] {
  return stories.filter((s) => new Date(s.expiresAt).getTime() >= now);
}
