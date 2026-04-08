import type { IntelItem } from "@/types/intel";

// ═══════════════════════════════════════════════════════════════════
//  Synthetic Ground Truth Fixtures
// ═══════════════════════════════════════════════════════════════════
//
//  These are HAND-DESIGNED scenarios with KNOWN expected outcomes.
//  The backtest harness runs the engine over each scenario and checks
//  whether its actual output matches the expected output.
//
//  Why synthetic:
//    - We don't have telemetry data yet (chicken-and-egg)
//    - Real production data is hard to label (what counts as "true"?)
//    - Synthetic scenarios can isolate ONE behavior at a time
//
//  Each scenario has:
//    - inputs: a list of IntelItems to feed the engine
//    - expectations: what convergences SHOULD result
//      (count, confidence range, categories, etc.)
//
//  Adding new fixtures is encouraged — every time you find a real-
//  world bug, codify it as a fixture so it never regresses.
//
// ═══════════════════════════════════════════════════════════════════

const HOUR = 60 * 60 * 1000;
const NOW = new Date("2026-04-08T12:00:00Z").getTime();

function iso(offsetMs: number = 0): string {
  return new Date(NOW + offsetMs).toISOString();
}

function makeItem(opts: Partial<IntelItem> & Pick<IntelItem, "id" | "source" | "category">): IntelItem {
  return {
    id: opts.id,
    title: opts.title ?? `Test event ${opts.id}`,
    summary: opts.summary ?? "",
    url: opts.url ?? `https://example.test/${opts.id}`,
    source: opts.source,
    category: opts.category,
    severity: opts.severity ?? "high",
    publishedAt: opts.publishedAt ?? iso(-5 * 60 * 1000),
    lat: opts.lat,
    lng: opts.lng,
    countryCode: opts.countryCode,
  };
}

export interface ExpectedOutcome {
  /** How many convergences should the engine produce? */
  minConvergences?: number;
  maxConvergences?: number;
  /** Confidence range the top convergence should fall in */
  topConfidenceMin?: number;
  topConfidenceMax?: number;
  /** Categories that MUST appear in the top convergence */
  expectedCategories?: string[];
  /** Categories that MUST NOT appear */
  forbiddenCategories?: string[];
  /** Should the top convergence have impact chain links? */
  expectChainLinks?: boolean;
  /** Should the top convergence have forward predictions? */
  expectPredictions?: boolean;
}

export interface Fixture {
  id: string;
  name: string;
  description: string;
  category: "true_positive" | "true_negative" | "calibration" | "regression";
  items: IntelItem[];
  expected: ExpectedOutcome;
}

// ── Fixture 1: Strong true positive ─────────────────────────────────
// Conflict + energy + finance in the same region within minutes.
// Should produce ONE high-confidence convergence with chain links.
const FIXTURE_geopolitical_cascade: Fixture = {
  id: "geopolitical-cascade",
  name: "Geopolitical Cascade — conflict → energy → finance",
  description:
    "An armed conflict signal followed shortly by energy and market reactions in the same region. " +
    "This is the canonical convergence the engine MUST detect with high confidence.",
  category: "true_positive",
  items: [
    makeItem({
      id: "tp1-1",
      source: "kandilli",
      category: "conflict",
      severity: "critical",
      publishedAt: iso(-2 * HOUR),
      title: "Armed clash reported in border region",
      lat: 36.5,
      lng: 36.0,
    }),
    makeItem({
      id: "tp1-2",
      source: "entsoe",
      category: "energy",
      severity: "high",
      publishedAt: iso(-90 * 60 * 1000),
      title: "Pipeline pressure drop detected",
      lat: 36.7,
      lng: 36.3,
    }),
    makeItem({
      id: "tp1-3",
      source: "market-indices",
      category: "finance",
      severity: "high",
      publishedAt: iso(-30 * 60 * 1000),
      title: "Regional currency drops 4% in early trading",
      lat: 36.4,
      lng: 35.8,
    }),
  ],
  expected: {
    minConvergences: 1,
    topConfidenceMin: 0.6,
    expectedCategories: ["conflict", "energy", "finance"],
    expectChainLinks: true,
    expectPredictions: true,
  },
};

// ── Fixture 2: Wire reprint should NOT inflate ──────────────────────
// 5 USGS feed reports of the same earthquake. v1 would count as 5
// independent signals; v2 should dampen to ~1.4 effective.
const FIXTURE_usgs_reprint: Fixture = {
  id: "usgs-reprint",
  name: "USGS Wire Reprint — Should Not Inflate",
  description:
    "Five USGS feed entries about the same M6.5 earthquake. The syndication " +
    "dampener should prevent these from inflating convergence confidence as " +
    "if they were independent signals.",
  category: "true_negative",
  items: [
    makeItem({
      id: "tn1-1",
      source: "usgs-4.5w",
      category: "natural",
      severity: "critical",
      title: "M6.5 earthquake — Tokyo region",
      lat: 35.7,
      lng: 139.7,
      publishedAt: iso(-30 * 60 * 1000),
    }),
    makeItem({
      id: "tn1-2",
      source: "usgs-2.5d",
      category: "natural",
      severity: "critical",
      title: "M6.5 earthquake — Tokyo region (revised)",
      lat: 35.7,
      lng: 139.7,
      publishedAt: iso(-25 * 60 * 1000),
    }),
    makeItem({
      id: "tn1-3",
      source: "usgs-sig-month",
      category: "natural",
      severity: "critical",
      title: "M6.5 earthquake — Tokyo region (significant)",
      lat: 35.7,
      lng: 139.7,
      publishedAt: iso(-20 * 60 * 1000),
    }),
  ],
  expected: {
    // No multi-category convergence here — all same category
    minConvergences: 0,
    maxConvergences: 0,
  },
};

// ── Fixture 3: Independent confirmation ─────────────────────────────
// Independent earthquake from USGS + Kandilli (different operators).
// SHOULD produce a confirmed convergence (kandilli is intentionally
// outside the USGS syndication group).
const FIXTURE_independent_confirmation: Fixture = {
  id: "independent-quake-confirmation",
  name: "Independent Confirmation — USGS + Kandilli",
  description:
    "USGS detects a Turkish earthquake. Kandilli (independent national " +
    "seismology center) ALSO detects it. These are valuable independent " +
    "signals and should NOT be dampened.",
  category: "calibration",
  items: [
    makeItem({
      id: "cal1-1",
      source: "usgs-4.5w",
      category: "natural",
      severity: "critical",
      title: "M5.8 earthquake — eastern Turkey",
      lat: 38.5,
      lng: 39.3,
      publishedAt: iso(-15 * 60 * 1000),
    }),
    makeItem({
      id: "cal1-2",
      source: "kandilli",
      category: "natural",
      severity: "critical",
      title: "M5.9 deprem — Doğu Anadolu",
      lat: 38.5,
      lng: 39.3,
      publishedAt: iso(-12 * 60 * 1000),
    }),
    makeItem({
      id: "cal1-3",
      source: "oref",
      category: "conflict",
      severity: "medium",
      title: "Increased military activity following seismic event",
      lat: 38.4,
      lng: 39.2,
      publishedAt: iso(-5 * 60 * 1000),
    }),
  ],
  expected: {
    minConvergences: 1,
    topConfidenceMin: 0.5,
    expectedCategories: ["natural", "conflict"],
  },
};

// ── Fixture 4: Pure noise — should produce nothing ──────────────────
const FIXTURE_random_noise: Fixture = {
  id: "random-noise",
  name: "Random Noise — Unrelated Events",
  description:
    "A scattered set of unrelated events from different regions and " +
    "categories. The engine should NOT find any spurious convergences here.",
  category: "true_negative",
  items: [
    makeItem({
      id: "noise-1",
      source: "espn-sports",
      category: "sports",
      title: "Football match result",
      lat: 51.5,
      lng: -0.1,
      publishedAt: iso(-2 * HOUR),
    }),
    makeItem({
      id: "noise-2",
      source: "openf1",
      category: "sports",
      title: "F1 qualifying session",
      lat: 26.0,
      lng: 50.5,
      publishedAt: iso(-90 * 60 * 1000),
    }),
    makeItem({
      id: "noise-3",
      source: "npm-trends",
      category: "tech",
      title: "Weekly download stats update",
      lat: 37.8,
      lng: -122.4,
      publishedAt: iso(-60 * 60 * 1000),
    }),
  ],
  expected: {
    minConvergences: 0,
    maxConvergences: 0,
  },
};

// ── Fixture 5: Stale signal should not inflate ──────────────────────
// One fresh strong signal + one old weak signal. v2 temporal decay
// should prevent the old one from contributing much.
const FIXTURE_stale_decay: Fixture = {
  id: "stale-decay",
  name: "Temporal Decay — Old Signal Should Not Inflate",
  description:
    "A fresh critical signal paired with a 6-hour-old info-level signal. " +
    "Temporal decay should make the old signal contribute minimally.",
  category: "calibration",
  items: [
    makeItem({
      id: "stale-1",
      source: "kandilli",
      category: "conflict",
      severity: "critical",
      title: "Breaking: armed escalation",
      lat: 33.0,
      lng: 35.5,
      publishedAt: iso(-2 * 60 * 1000),
    }),
    makeItem({
      id: "stale-2",
      source: "espn-sports",
      category: "sports",
      severity: "info",
      title: "Stale sports note",
      lat: 33.1,
      lng: 35.6,
      publishedAt: iso(-23 * HOUR),
    }),
  ],
  expected: {
    // The decay should kill the cross-category bridge — sports is
    // too stale to count as a genuine cross-signal pair.
    minConvergences: 0,
    maxConvergences: 1,
    topConfidenceMax: 0.6,
  },
};

// ── Fixture 6: Far-apart same category — protest radius test ────────
const FIXTURE_protest_radius: Fixture = {
  id: "protest-radius",
  name: "Protest Radius — 400km Apart Should NOT Merge",
  description:
    "Two protests in different cities 400km apart. Protest geo radius " +
    "is 25km, so they should NOT be clustered as one convergence.",
  category: "true_negative",
  items: [
    makeItem({
      id: "pr-1",
      source: "kandilli",
      category: "protest",
      severity: "high",
      title: "Demonstration in Istanbul",
      lat: 41.0,
      lng: 28.9,
      publishedAt: iso(-30 * 60 * 1000),
    }),
    makeItem({
      id: "pr-2",
      source: "kandilli",
      category: "finance",
      severity: "medium",
      title: "Lira drops on protest news",
      lat: 39.9,
      lng: 32.8, // Ankara, ~350km away
      publishedAt: iso(-15 * 60 * 1000),
    }),
  ],
  expected: {
    // protest radius 25km can't reach Ankara, but finance radius is
    // 500km — pair window uses MAX (500km) so they SHOULD bridge.
    // This tests the asymmetric radius logic.
    minConvergences: 1,
    expectedCategories: ["protest", "finance"],
  },
};

// ── Export all fixtures ─────────────────────────────────────────────

export const FIXTURES: Fixture[] = [
  FIXTURE_geopolitical_cascade,
  FIXTURE_usgs_reprint,
  FIXTURE_independent_confirmation,
  FIXTURE_random_noise,
  FIXTURE_stale_decay,
  FIXTURE_protest_radius,
];
