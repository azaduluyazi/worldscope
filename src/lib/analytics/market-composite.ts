/**
 * 7-Signal Market Composite Index
 * Aggregates fear/greed indicators into a single -100..+100 score.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketSignalInput {
  /** CNN Fear & Greed index (0-100) */
  fearGreed: number;
  /** CBOE VIX index */
  vix: number;
  /** Gold price change % (e.g. 1.5 means +1.5%) */
  goldChange: number;
  /** Oil price change % */
  oilChange: number;
  /** USD Index change % */
  usdChange: number;
  /** 10Y-2Y Treasury bond spread (percentage points) */
  bondSpread: number;
  /** Bitcoin dominance % (e.g. 55 means 55%) */
  btcDominance: number;
}

export interface SignalDetail {
  name: string;
  value: number;
  normalized: number;
  contribution: number;
}

export interface MarketCompositeResult {
  /** Composite score from -100 (extreme fear) to +100 (extreme greed) */
  score: number;
  label: string;
  signals: SignalDetail[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Signal weights (sum = 1.0)
// ---------------------------------------------------------------------------

interface SignalSpec {
  name: string;
  weight: number;
  normalize: (input: MarketSignalInput) => number;
}

const SIGNAL_SPECS: SignalSpec[] = [
  {
    name: "Fear & Greed",
    weight: 0.20,
    normalize: (d) => clamp((d.fearGreed - 50) / 50),
  },
  {
    name: "VIX",
    weight: 0.18,
    normalize: (d) => clamp(-(d.vix - 20) / 30),
  },
  {
    name: "Gold Change",
    weight: 0.12,
    normalize: (d) => clamp(-d.goldChange / 5),
  },
  {
    name: "Oil Change",
    weight: 0.12,
    normalize: (d) => clamp(d.oilChange / 10),
  },
  {
    name: "USD Index",
    weight: 0.14,
    normalize: (d) => clamp(-d.usdChange / 3),
  },
  {
    name: "Bond Spread (10Y-2Y)",
    weight: 0.14,
    normalize: (d) => clamp(d.bondSpread / 2),
  },
  {
    name: "BTC Dominance",
    weight: 0.10,
    normalize: (d) => clamp(-(d.btcDominance - 50) / 20),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp a value to the -1..+1 range. */
function clamp(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

function getLabel(score: number): string {
  if (score <= -60) return "Extreme Fear";
  if (score <= -20) return "Fear";
  if (score <= 20) return "Neutral";
  if (score <= 60) return "Greed";
  return "Extreme Greed";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the 7-signal market composite index.
 *
 * @param input  Raw market data values
 * @returns      Composite result with score, label, and per-signal breakdown
 */
export function calculateMarketComposite(
  input: MarketSignalInput,
): MarketCompositeResult {
  const signals: SignalDetail[] = [];
  let weightedSum = 0;

  for (const spec of SIGNAL_SPECS) {
    const normalized = spec.normalize(input);
    const contribution = normalized * spec.weight;
    weightedSum += contribution;

    // Pick the raw value that this signal reads from
    const rawValue = getRawValue(spec.name, input);

    signals.push({
      name: spec.name,
      value: Math.round(rawValue * 100) / 100,
      normalized: Math.round(normalized * 1000) / 1000,
      contribution: Math.round(contribution * 1000) / 1000,
    });
  }

  // Scale to -100..+100
  const score = Math.round(clamp(weightedSum) * 100);

  return {
    score,
    label: getLabel(score),
    signals,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Internal: map signal name to raw input value for the detail breakdown
// ---------------------------------------------------------------------------

function getRawValue(name: string, input: MarketSignalInput): number {
  switch (name) {
    case "Fear & Greed":
      return input.fearGreed;
    case "VIX":
      return input.vix;
    case "Gold Change":
      return input.goldChange;
    case "Oil Change":
      return input.oilChange;
    case "USD Index":
      return input.usdChange;
    case "Bond Spread (10Y-2Y)":
      return input.bondSpread;
    case "BTC Dominance":
      return input.btcDominance;
    default:
      return 0;
  }
}
