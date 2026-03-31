import type { IntelItem, Severity } from "@/types/intel";

// ── Types ─────────────────────────────────────────────────

export interface ConflictZone {
  id: string;
  name: string;
  countries: string[];
  events: IntelItem[];
  escalationScore: number; // -100 (de-escalation) to +100 (escalation)
  trend: "escalating" | "stable" | "de-escalating";
  dailyScores: { date: string; score: number }[];
  fatalities: number;
  lastEventAt: string;
}

// ── Severity weights for escalation scoring ───────────────

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 10,
  high: 6,
  medium: 3,
  low: 1,
  info: 0,
};

// ── Country name mapping for grouping ─────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  UA: "Ukraine",
  RU: "Russia",
  IL: "Israel",
  PS: "Palestine",
  SY: "Syria",
  IQ: "Iraq",
  YE: "Yemen",
  SD: "Sudan",
  SS: "South Sudan",
  MM: "Myanmar",
  ET: "Ethiopia",
  SO: "Somalia",
  AF: "Afghanistan",
  LY: "Libya",
  CD: "DR Congo",
  ML: "Mali",
  BF: "Burkina Faso",
  NE: "Niger",
  NG: "Nigeria",
  MZ: "Mozambique",
  CM: "Cameroon",
  KP: "North Korea",
  CN: "China",
  TW: "Taiwan",
  IR: "Iran",
  PK: "Pakistan",
  IN: "India",
  LB: "Lebanon",
  HT: "Haiti",
  CO: "Colombia",
  MX: "Mexico",
};

// ── Conflict zone grouping rules ──────────────────────────
// Some country codes belong to the same conflict zone

const CONFLICT_GROUPS: Record<string, string[]> = {
  "Ukraine-Russia": ["UA", "RU"],
  "Israel-Palestine": ["IL", "PS"],
  "Middle East": ["SY", "IQ", "YE", "LB", "IR"],
  "Sahel Crisis": ["ML", "BF", "NE"],
  "Horn of Africa": ["ET", "SO", "SD", "SS"],
  "Great Lakes": ["CD", "CM", "MZ"],
};

function getZoneForCountry(code: string): string | null {
  for (const [zone, codes] of Object.entries(CONFLICT_GROUPS)) {
    if (codes.includes(code)) return zone;
  }
  return null;
}

// ── Main Detection Function ───────────────────────────────

/**
 * Detect and score conflict zones from intel events.
 * Groups events by country/region, calculates escalation scores,
 * and returns the top 15 most active conflict zones.
 */
export function detectConflictZones(items: IntelItem[]): ConflictZone[] {
  // Filter to conflict-related events
  const conflictItems = items.filter(
    (item) =>
      item.category === "conflict" ||
      item.category === "protest" ||
      (item.category === "diplomacy" &&
        (item.severity === "critical" || item.severity === "high"))
  );

  if (conflictItems.length === 0) return [];

  // Group by conflict zone or country
  const groups = new Map<string, IntelItem[]>();

  for (const item of conflictItems) {
    const code = item.countryCode?.toUpperCase();
    if (!code) continue;

    // Check if this country belongs to a known conflict group
    const zone = getZoneForCountry(code);
    const key = zone || COUNTRY_NAMES[code] || code;

    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  // Calculate escalation score for each zone
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const zones: ConflictZone[] = [];

  for (const [name, events] of groups) {
    if (events.length < 2) continue; // Need at least 2 events to detect a pattern

    // Collect unique country codes
    const countries = [
      ...new Set(
        events
          .map((e) => e.countryCode?.toUpperCase())
          .filter((c): c is string => !!c)
      ),
    ];

    // Split into recent (last 3 days) vs earlier (days 4-7)
    const recentCutoff = now - 3 * dayMs;
    const recent = events.filter(
      (e) => new Date(e.publishedAt).getTime() >= recentCutoff
    );
    const earlier = events.filter(
      (e) => new Date(e.publishedAt).getTime() < recentCutoff
    );

    // ── Frequency change score (scaled -40 to +40) ──
    const recentRate = recent.length / 3; // events per day (recent)
    const earlierRate = earlier.length / Math.max(4, 1); // events per day (earlier)
    const freqChange =
      earlierRate > 0
        ? ((recentRate - earlierRate) / earlierRate) * 40
        : recent.length > 0
          ? 20
          : 0;
    const freqScore = Math.max(-40, Math.min(40, freqChange));

    // ── Severity shift score (scaled -30 to +30) ──
    const recentSevAvg =
      recent.length > 0
        ? recent.reduce((s, e) => s + SEVERITY_WEIGHT[e.severity], 0) /
          recent.length
        : 0;
    const earlierSevAvg =
      earlier.length > 0
        ? earlier.reduce((s, e) => s + SEVERITY_WEIGHT[e.severity], 0) /
          earlier.length
        : 0;
    const sevShift = earlierSevAvg > 0
      ? ((recentSevAvg - earlierSevAvg) / earlierSevAvg) * 30
      : recentSevAvg > 5
        ? 15
        : 0;
    const sevScore = Math.max(-30, Math.min(30, sevShift));

    // ── Time acceleration score (scaled -30 to +30) ──
    // How much faster are events arriving?
    let accelScore = 0;
    if (recent.length >= 2) {
      const sortedRecent = [...recent].sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      const gaps: number[] = [];
      for (let i = 1; i < sortedRecent.length; i++) {
        const gap =
          new Date(sortedRecent[i - 1].publishedAt).getTime() -
          new Date(sortedRecent[i].publishedAt).getTime();
        gaps.push(gap);
      }
      const avgGapHours =
        gaps.reduce((s, g) => s + g, 0) / gaps.length / (60 * 60 * 1000);
      // Less than 6 hours between events = fast acceleration
      if (avgGapHours < 6) accelScore = 30;
      else if (avgGapHours < 12) accelScore = 20;
      else if (avgGapHours < 24) accelScore = 10;
      else if (avgGapHours > 72) accelScore = -15;
    }

    // ── Combine scores ──
    const escalationScore = Math.max(
      -100,
      Math.min(100, Math.round(freqScore + sevScore + accelScore))
    );

    // ── Daily score history (last 7 days) ──
    const dailyScores: { date: string; score: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const dayStart = now - (d + 1) * dayMs;
      const dayEnd = now - d * dayMs;
      const dayEvents = events.filter((e) => {
        const t = new Date(e.publishedAt).getTime();
        return t >= dayStart && t < dayEnd;
      });
      const dayScore = dayEvents.reduce(
        (s, e) => s + SEVERITY_WEIGHT[e.severity],
        0
      );
      const date = new Date(dayEnd).toISOString().split("T")[0];
      dailyScores.push({ date, score: dayScore });
    }

    // ── Trend determination ──
    const trend: ConflictZone["trend"] =
      escalationScore > 20
        ? "escalating"
        : escalationScore < -20
          ? "de-escalating"
          : "stable";

    // ── Fatalities estimate (rough: critical events x2, high x1) ──
    const fatalities = events.reduce((sum, e) => {
      if (e.severity === "critical") return sum + 2;
      if (e.severity === "high") return sum + 1;
      return sum;
    }, 0);

    const lastEventAt = events
      .map((e) => e.publishedAt)
      .sort()
      .pop() || new Date().toISOString();

    zones.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      countries,
      events,
      escalationScore,
      trend,
      dailyScores,
      fatalities,
      lastEventAt,
    });
  }

  // Sort by absolute escalation score (most active first)
  zones.sort((a, b) => Math.abs(b.escalationScore) - Math.abs(a.escalationScore));

  return zones.slice(0, 15);
}
