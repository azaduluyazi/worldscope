# Country Pages Overhaul — Rich Dashboard + Cross-Country Navigation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform basic country pages into rich, interactive intelligence dashboards with mini-map, analytics, category/severity filters, and seamless cross-country navigation.

**Architecture:** Convert the current server-only static page into a hybrid: server component fetches initial data + SEO metadata, client components handle interactivity (map, filters, navigation). Reuse existing dashboard patterns (HUD theme, severity bars, category icons) but tailored for single-country context. New `CountryNav` component provides region-grouped navigation with keyboard shortcuts.

**Tech Stack:** Next.js App Router (server + client components), Mapbox GL (mini-map), SWR (client refresh), next-intl (i18n), Supabase (data), Tailwind (styling)

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/country/CountryDashboard.tsx` | Client shell — orchestrates all country sub-components, manages filter state |
| Create | `src/components/country/CountryMiniMap.tsx` | Focused Mapbox map showing country events with markers |
| Create | `src/components/country/CountryStats.tsx` | Severity distribution, category breakdown, quick stats cards |
| Create | `src/components/country/CountryTimeline.tsx` | 24h event timeline heatmap (reuses IntelFeed analysis pattern) |
| Create | `src/components/country/CountryNav.tsx` | Region-grouped country navigation with search + keyboard prev/next |
| Create | `src/components/country/CountryEventList.tsx` | Filtered event list with infinite scroll |
| Create | `src/components/country/CountryFilters.tsx` | Category + severity filter toggles (compact horizontal bar) |
| Create | `src/hooks/useCountryEvents.ts` | SWR hook — fetches `/api/intel?country=XX`, merges realtime |
| Create | `src/lib/utils/country-helpers.ts` | getFlagEmoji, getNeighbors (prev/next in region), threat score calc |
| Modify | `src/app/country/[code]/page.tsx` | Slim server wrapper — metadata + initial data fetch, renders CountryDashboard |
| Modify | `src/i18n/en.json` | Add `country.*` translation keys |
| Modify | `src/i18n/tr.json` | Add `country.*` translation keys (Turkish) |
| Create | `tests/unit/country-helpers.test.ts` | Tests for getFlagEmoji, getNeighbors, threat score calc |
| Create | `tests/unit/country-nav.test.ts` | Tests for CountryNav search + region filtering logic |

---

## Task 1: Country Helper Utilities

**Files:**
- Create: `src/lib/utils/country-helpers.ts`
- Create: `tests/unit/country-helpers.test.ts`

- [ ] **Step 1: Write failing tests for country helpers**

```typescript
// tests/unit/country-helpers.test.ts
import { describe, it, expect } from "vitest";
import { getFlagEmoji, getRegionCountries, getNeighborCountries, computeCountryThreat } from "@/lib/utils/country-helpers";

describe("getFlagEmoji", () => {
  it("converts TR to Turkish flag", () => {
    expect(getFlagEmoji("TR")).toBe("🇹🇷");
  });
  it("converts US to American flag", () => {
    expect(getFlagEmoji("US")).toBe("🇺🇸");
  });
  it("handles lowercase input", () => {
    expect(getFlagEmoji("tr")).toBe("🇹🇷");
  });
});

describe("getRegionCountries", () => {
  it("returns only Middle East countries for that region", () => {
    const result = getRegionCountries("Middle East");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.region === "Middle East")).toBe(true);
  });
  it("returns empty array for unknown region", () => {
    expect(getRegionCountries("Mars")).toEqual([]);
  });
});

describe("getNeighborCountries", () => {
  it("returns prev and next in same region", () => {
    const { prev, next } = getNeighborCountries("IL"); // Israel in Middle East
    expect(prev).toBeDefined();
    expect(next).toBeDefined();
    expect(prev!.region).toBe("Middle East");
    expect(next!.region).toBe("Middle East");
  });
  it("wraps around at region boundaries", () => {
    // First country in Middle East is TR
    const { prev } = getNeighborCountries("TR");
    expect(prev).toBeDefined(); // should wrap to last in region
  });
});

describe("computeCountryThreat", () => {
  it("returns 0 for empty events", () => {
    expect(computeCountryThreat([])).toBe(0);
  });
  it("returns higher score for critical events", () => {
    const critical = computeCountryThreat([
      { severity: "critical" }, { severity: "critical" },
    ]);
    const low = computeCountryThreat([
      { severity: "low" }, { severity: "low" },
    ]);
    expect(critical).toBeGreaterThan(low);
  });
  it("caps at 100", () => {
    const events = Array.from({ length: 100 }, () => ({ severity: "critical" as const }));
    expect(computeCountryThreat(events)).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /c/Users/azadu/worldmotion/worldscope && npx vitest run tests/unit/country-helpers.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement country helpers**

```typescript
// src/lib/utils/country-helpers.ts
import { COUNTRIES, type CountryMeta } from "@/config/countries";
import type { Severity } from "@/types/intel";

/** Convert ISO 3166-1 alpha-2 code to flag emoji */
export function getFlagEmoji(code: string): string {
  const offset = 127397;
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join("");
}

/** Get all countries in a given region */
export function getRegionCountries(region: string): CountryMeta[] {
  return COUNTRIES.filter((c) => c.region === region);
}

/** Get previous/next country within the same region (wrapping) */
export function getNeighborCountries(code: string): { prev: CountryMeta | null; next: CountryMeta | null } {
  const country = COUNTRIES.find((c) => c.code === code.toUpperCase());
  if (!country) return { prev: null, next: null };

  const regionCountries = COUNTRIES.filter((c) => c.region === country.region);
  const idx = regionCountries.findIndex((c) => c.code === country.code);

  const prev = regionCountries[(idx - 1 + regionCountries.length) % regionCountries.length];
  const next = regionCountries[(idx + 1) % regionCountries.length];

  return { prev: prev || null, next: next || null };
}

/** Severity weights matching existing threat scoring convention */
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  high: 6,
  medium: 3,
  low: 1,
  info: 0,
};

/** Compute country-level threat score (0-100) using distribution-weighted average */
export function computeCountryThreat(events: { severity: Severity | string }[]): number {
  if (events.length === 0) return 0;

  const totalWeight = events.reduce((sum, e) => {
    return sum + (SEVERITY_WEIGHTS[e.severity as Severity] ?? 0);
  }, 0);

  // Normalize: max possible = events.length * 10 (all critical)
  const maxPossible = events.length * 10;
  const raw = (totalWeight / maxPossible) * 100;

  return Math.min(100, Math.round(raw));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /c/Users/azadu/worldmotion/worldscope && npx vitest run tests/unit/country-helpers.test.ts`
Expected: PASS — all 8 tests green

- [ ] **Step 5: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/lib/utils/country-helpers.ts tests/unit/country-helpers.test.ts
git commit -m "feat(country): add country helper utilities (flag emoji, neighbors, threat score)"
```

---

## Task 2: i18n — Country Page Translation Keys

**Files:**
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/tr.json`

- [ ] **Step 1: Add country namespace to en.json**

Add after the `"locale"` block:

```json
"country": {
  "intelReport": "{name} Intelligence Report",
  "events72h": "{count} events (72h)",
  "threatLevel": "THREAT LEVEL",
  "threatScore": "THREAT SCORE",
  "topCategories": "TOP CATEGORIES",
  "geoData": "GEO DATA",
  "recentIntel": "RECENT INTELLIGENCE",
  "noEvents": "No intelligence events for {name} in the last 72 hours.",
  "backToDashboard": "Back to Live Dashboard",
  "allCountries": "ALL MONITORED COUNTRIES",
  "prevCountry": "Previous Country",
  "nextCountry": "Next Country",
  "searchCountry": "Search country...",
  "regionAll": "ALL",
  "filters": "FILTERS",
  "clearFilters": "CLEAR",
  "timeline": "24H TIMELINE",
  "severityDist": "SEVERITY DISTRIBUTION",
  "categoryBreak": "CATEGORY BREAKDOWN",
  "sources": "SOURCES",
  "viewOnMap": "VIEW ON MAP",
  "eventCount": "{count} events",
  "criticalAlerts": "Critical",
  "highAlerts": "High",
  "geoLocated": "Geo-Located",
  "activeSources": "Sources"
}
```

- [ ] **Step 2: Add country namespace to tr.json**

```json
"country": {
  "intelReport": "{name} İstihbarat Raporu",
  "events72h": "{count} olay (72s)",
  "threatLevel": "TEHDİT SEVİYESİ",
  "threatScore": "TEHDİT SKORU",
  "topCategories": "ÜST KATEGORİLER",
  "geoData": "COĞRAFİ VERİ",
  "recentIntel": "SON İSTİHBARAT",
  "noEvents": "Son 72 saatte {name} için istihbarat olayı bulunamadı.",
  "backToDashboard": "Canlı Panoya Dön",
  "allCountries": "İZLENEN TÜM ÜLKELER",
  "prevCountry": "Önceki Ülke",
  "nextCountry": "Sonraki Ülke",
  "searchCountry": "Ülke ara...",
  "regionAll": "TÜMÜ",
  "filters": "FİLTRELER",
  "clearFilters": "TEMİZLE",
  "timeline": "24S ZAMAN ÇİZELGESİ",
  "severityDist": "CİDDİYET DAĞILIMI",
  "categoryBreak": "KATEGORİ DAĞILIMI",
  "sources": "KAYNAKLAR",
  "viewOnMap": "HARİTADA GÖR",
  "eventCount": "{count} olay",
  "criticalAlerts": "Kritik",
  "highAlerts": "Yüksek",
  "geoLocated": "Konumlu",
  "activeSources": "Kaynak"
}
```

- [ ] **Step 3: Run i18n tests**

Run: `cd /c/Users/azadu/worldmotion/worldscope && npx vitest run tests/unit/i18n.test.ts`
Expected: PASS (existing test checks key parity between en.json and tr.json)

- [ ] **Step 4: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/i18n/en.json src/i18n/tr.json
git commit -m "feat(country): add i18n translation keys for country pages (EN+TR)"
```

---

## Task 3: Country Events SWR Hook

**Files:**
- Create: `src/hooks/useCountryEvents.ts`

- [ ] **Step 1: Create the SWR hook for country-scoped events**

```typescript
// src/hooks/useCountryEvents.ts
"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import type { IntelFeedResponse, IntelItem, Category, Severity } from "@/types/intel";
import { SEVERITY_ORDER } from "@/types/intel";
import { useRealtimeEvents } from "./useRealtimeEvents";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseCountryEventsOptions {
  countryCode: string;
  categories?: Set<string>;
  severities?: Set<string>;
}

export function useCountryEvents({ countryCode, categories, severities }: UseCountryEventsOptions) {
  const { data, error, isLoading, mutate } = useSWR<IntelFeedResponse>(
    `/api/intel?country=${countryCode.toUpperCase()}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    }
  );

  // Merge realtime events matching this country
  const handleRealtimeEvent = useCallback(
    (newItem: IntelItem) => {
      if (newItem.countryCode?.toUpperCase() !== countryCode.toUpperCase()) return;

      mutate(
        (current) => {
          if (!current) return current;
          const key = newItem.title.toLowerCase().slice(0, 60);
          const exists = current.items.some(
            (i) => i.title.toLowerCase().slice(0, 60) === key
          );
          if (exists) return current;

          const updated = [newItem, ...current.items];
          updated.sort((a, b) => {
            const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
            if (sevDiff !== 0) return sevDiff;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          });

          return {
            ...current,
            items: updated.slice(0, 200),
            total: Math.min(updated.length, 200),
          };
        },
        { revalidate: false }
      );
    },
    [mutate, countryCode]
  );

  useRealtimeEvents(handleRealtimeEvent);

  // Apply client-side filters
  const filteredItems = useMemo(() => {
    let items = data?.items || [];
    if (categories && categories.size > 0) {
      items = items.filter((i) => categories.has(i.category));
    }
    if (severities && severities.size > 0) {
      items = items.filter((i) => severities.has(i.severity));
    }
    return items;
  }, [data?.items, categories, severities]);

  return {
    items: filteredItems,
    allItems: data?.items || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
```

- [ ] **Step 2: Verify `/api/intel` supports country param — check existing route**

The existing `/api/intel/route.ts` needs to support `?country=XX` query param to filter server-side. If it doesn't already, add a simple filter:

In `src/app/api/intel/route.ts`, after the items are aggregated and before returning, add:
```typescript
// Country filter (if provided)
const country = url.searchParams.get("country");
if (country) {
  items = items.filter((i) => i.countryCode?.toUpperCase() === country.toUpperCase());
}
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/hooks/useCountryEvents.ts src/app/api/intel/route.ts
git commit -m "feat(country): add useCountryEvents SWR hook with realtime + country filter in API"
```

---

## Task 4: Country Filters Component

**Files:**
- Create: `src/components/country/CountryFilters.tsx`

- [ ] **Step 1: Create compact horizontal filter bar**

```typescript
// src/components/country/CountryFilters.tsx
"use client";

import { useTranslations } from "next-intl";
import { CATEGORY_ICONS, SEVERITY_COLORS } from "@/types/intel";
import type { Category, Severity } from "@/types/intel";

const CATEGORIES: Category[] = [
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health",
];

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];

interface CountryFiltersProps {
  activeCategories: Set<string>;
  activeSeverities: Set<string>;
  onToggleCategory: (cat: string) => void;
  onToggleSeverity: (sev: string) => void;
  onClear: () => void;
}

export function CountryFilters({
  activeCategories,
  activeSeverities,
  onToggleCategory,
  onToggleSeverity,
  onClear,
}: CountryFiltersProps) {
  const t = useTranslations("country");
  const hasFilters = activeCategories.size > 0 || activeSeverities.size > 0;

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] font-bold text-hud-accent tracking-wider">
          ◆ {t("filters")}
        </span>
        {hasFilters && (
          <button
            onClick={onClear}
            className="font-mono text-[8px] text-hud-muted hover:text-hud-accent transition-colors"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Category toggles */}
      <div className="flex flex-wrap gap-1 mb-2">
        {CATEGORIES.map((cat) => {
          const active = activeCategories.has(cat);
          return (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`font-mono text-[8px] px-1.5 py-0.5 rounded border transition-all ${
                active
                  ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent"
                  : "bg-hud-panel border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-muted"
              }`}
              title={cat}
            >
              {CATEGORY_ICONS[cat]} {cat.slice(0, 4).toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Severity toggles */}
      <div className="flex gap-1">
        {SEVERITIES.map((sev) => {
          const active = activeSeverities.has(sev);
          const color = SEVERITY_COLORS[sev];
          return (
            <button
              key={sev}
              onClick={() => onToggleSeverity(sev)}
              className="font-mono text-[8px] px-1.5 py-0.5 rounded border transition-all"
              style={{
                backgroundColor: active ? `${color}20` : undefined,
                borderColor: active ? `${color}50` : undefined,
                color: active ? color : undefined,
              }}
            >
              {sev.slice(0, 4).toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/components/country/CountryFilters.tsx
git commit -m "feat(country): add CountryFilters component (category + severity toggles)"
```

---

## Task 5: Country Stats + Timeline Components

**Files:**
- Create: `src/components/country/CountryStats.tsx`
- Create: `src/components/country/CountryTimeline.tsx`

- [ ] **Step 1: Create CountryStats component**

```typescript
// src/components/country/CountryStats.tsx
"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem, Severity, Category } from "@/types/intel";
import { computeCountryThreat } from "@/lib/utils/country-helpers";

interface CountryStatsProps {
  items: IntelItem[];
  allItems: IntelItem[]; // unfiltered for stats
}

export function CountryStats({ items, allItems }: CountryStatsProps) {
  const t = useTranslations("country");

  const stats = useMemo(() => {
    const sevCounts: Record<string, number> = {};
    const catCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    let geoCount = 0;

    allItems.forEach((e) => {
      sevCounts[e.severity] = (sevCounts[e.severity] || 0) + 1;
      catCounts[e.category] = (catCounts[e.category] || 0) + 1;
      sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
      if (e.lat != null && e.lng != null) geoCount++;
    });

    const topCategories = Object.entries(catCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const threatScore = computeCountryThreat(allItems);

    return { sevCounts, catCounts, topCategories, threatScore, geoCount, sourceCount: Object.keys(sourceCounts).length };
  }, [allItems]);

  const threatColor =
    stats.threatScore >= 70 ? "#ff4757" :
    stats.threatScore >= 40 ? "#ffd000" :
    stats.threatScore >= 20 ? "#00e5ff" : "#00ff88";

  return (
    <div className="space-y-3">
      {/* Threat Score */}
      <div className="bg-hud-surface border border-hud-border rounded-md p-4 text-center">
        <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-2">
          ◆ {t("threatScore")}
        </div>
        <div
          className="font-mono text-[32px] font-bold"
          style={{ color: threatColor, textShadow: `0 0 20px ${threatColor}40` }}
        >
          {stats.threatScore}
        </div>
        <div className="font-mono text-[8px] text-hud-muted mt-1">/100</div>
      </div>

      {/* Severity Distribution */}
      <div className="bg-hud-surface border border-hud-border rounded-md p-4">
        <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
          ◆ {t("threatLevel")}
        </div>
        {(["critical", "high", "medium", "low", "info"] as Severity[]).map((sev) => {
          const count = stats.sevCounts[sev] || 0;
          const pct = allItems.length > 0 ? (count / allItems.length) * 100 : 0;
          return (
            <div key={sev} className="flex items-center gap-2 mb-1.5">
              <span
                className="font-mono text-[8px] w-14 text-right uppercase"
                style={{ color: SEVERITY_COLORS[sev] }}
              >
                {sev}
              </span>
              <div className="flex-1 h-2 bg-hud-panel rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: SEVERITY_COLORS[sev],
                    boxShadow: count > 0 ? `0 0 6px ${SEVERITY_COLORS[sev]}60` : "none",
                  }}
                />
              </div>
              <span className="font-mono text-[8px] text-hud-muted w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Top Categories */}
      <div className="bg-hud-surface border border-hud-border rounded-md p-4">
        <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
          ◆ {t("topCategories")}
        </div>
        {stats.topCategories.map(([cat, count]) => (
          <div key={cat} className="flex items-center justify-between py-1 border-b border-hud-border last:border-0">
            <span className="font-mono text-[9px] text-hud-text">
              {CATEGORY_ICONS[cat as Category] || "📌"} {cat}
            </span>
            <span className="font-mono text-[9px] text-hud-muted">{count}</span>
          </div>
        ))}
        {stats.topCategories.length === 0 && (
          <p className="text-[9px] text-hud-muted">—</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-hud-surface border border-hud-border rounded-md p-2 text-center">
          <div className="font-mono text-[14px] text-severity-critical font-bold">
            {stats.sevCounts["critical"] || 0}
          </div>
          <div className="font-mono text-[7px] text-hud-muted uppercase">{t("criticalAlerts")}</div>
        </div>
        <div className="bg-hud-surface border border-hud-border rounded-md p-2 text-center">
          <div className="font-mono text-[14px] text-severity-high font-bold">
            {stats.sevCounts["high"] || 0}
          </div>
          <div className="font-mono text-[7px] text-hud-muted uppercase">{t("highAlerts")}</div>
        </div>
        <div className="bg-hud-surface border border-hud-border rounded-md p-2 text-center">
          <div className="font-mono text-[14px] text-severity-low font-bold">
            {stats.geoCount}
          </div>
          <div className="font-mono text-[7px] text-hud-muted uppercase">{t("geoLocated")}</div>
        </div>
        <div className="bg-hud-surface border border-hud-border rounded-md p-2 text-center">
          <div className="font-mono text-[14px] text-hud-accent font-bold">
            {stats.sourceCount}
          </div>
          <div className="font-mono text-[7px] text-hud-muted uppercase">{t("activeSources")}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CountryTimeline component**

```typescript
// src/components/country/CountryTimeline.tsx
"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { IntelItem } from "@/types/intel";

interface CountryTimelineProps {
  items: IntelItem[];
}

export function CountryTimeline({ items }: CountryTimelineProps) {
  const t = useTranslations("country");

  const { buckets, maxBucket } = useMemo(() => {
    const now = Date.now();
    const timelineBuckets = Array.from({ length: 12 }, () => ({
      total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0,
    }));

    items.forEach((item) => {
      const ageMs = now - new Date(item.publishedAt).getTime();
      const idx = Math.min(11, Math.max(0, Math.floor(ageMs / (2 * 60 * 60 * 1000))));
      timelineBuckets[idx].total++;
      const sev = item.severity as keyof (typeof timelineBuckets)[0];
      if (sev in timelineBuckets[idx]) {
        (timelineBuckets[idx] as Record<string, number>)[sev]++;
      }
    });

    return {
      buckets: timelineBuckets,
      maxBucket: Math.max(1, ...timelineBuckets.map((b) => b.total)),
    };
  }, [items]);

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("timeline")}
      </div>
      <div className="flex items-end gap-[3px] h-16">
        {buckets.map((bucket, i) => {
          const height = Math.max(2, (bucket.total / maxBucket) * 100);
          const color =
            bucket.critical > 0 ? "#ff4757" :
            bucket.high > 0 ? "#ffd000" :
            bucket.medium > 0 ? "#00e5ff" : "#00ff88";
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-500 relative group cursor-default"
              style={{
                height: `${height}%`,
                backgroundColor: `${color}80`,
                border: `1px solid ${color}40`,
                minHeight: 2,
              }}
              title={`${(11 - i) * 2}-${(11 - i) * 2 + 2}h ago: ${bucket.total} events`}
            >
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[6px] text-hud-muted opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {bucket.total}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[6px] text-hud-muted">24h</span>
        <span className="font-mono text-[6px] text-hud-muted">now</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/components/country/CountryStats.tsx src/components/country/CountryTimeline.tsx
git commit -m "feat(country): add CountryStats (threat score, severity, categories) + CountryTimeline"
```

---

## Task 6: Country Mini Map

**Files:**
- Create: `src/components/country/CountryMiniMap.tsx`

- [ ] **Step 1: Create focused Mapbox mini-map for country page**

```typescript
// src/components/country/CountryMiniMap.tsx
"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import Map, { NavigationControl, Source, Layer, Popup } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { CircleLayer } from "mapbox-gl";
import { MAP_STYLE } from "@/config/map-layers";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import type { CountryMeta } from "@/config/countries";
import { timeAgo } from "@/lib/utils/date";
import "mapbox-gl/dist/mapbox-gl.css";

const SEVERITY_SIZE: Record<string, number> = {
  critical: 12, high: 9, medium: 7, low: 5, info: 4,
};

const pointStyle: CircleLayer = {
  id: "country-points",
  type: "circle",
  source: "country-events",
  paint: {
    "circle-color": ["get", "color"],
    "circle-radius": ["get", "radius"],
    "circle-opacity": 0.85,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": ["get", "color"],
    "circle-stroke-opacity": 0.3,
  },
};

const glowStyle: CircleLayer = {
  id: "country-glow",
  type: "circle",
  source: "country-events",
  paint: {
    "circle-color": "transparent",
    "circle-radius": ["*", ["get", "radius"], 2],
    "circle-stroke-width": 2,
    "circle-stroke-color": ["get", "color"],
    "circle-stroke-opacity": 0.15,
  },
};

interface CountryMiniMapProps {
  country: CountryMeta;
  items: IntelItem[];
}

export function CountryMiniMap({ country, items }: CountryMiniMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<IntelItem | null>(null);

  const geoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: items
      .filter((i): i is IntelItem & { lat: number; lng: number } => i.lat != null && i.lng != null)
      .map((e) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [e.lng, e.lat] },
        properties: {
          id: e.id,
          color: SEVERITY_COLORS[e.severity] || "#5a7a9a",
          radius: SEVERITY_SIZE[e.severity] || 6,
        },
      })),
  }), [items]);

  // Fly to country on mount
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const timer = setTimeout(() => {
      map.flyTo({
        center: [country.lng, country.lat],
        zoom: country.zoom,
        pitch: 30,
        duration: 2000,
        essential: true,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [country]);

  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const features = map.queryRenderedFeatures(e.point, { layers: ["country-points"] });
    if (features.length > 0) {
      const id = features[0].properties?.id;
      const item = items.find((i) => i.id === id);
      if (item) {
        setSelected(item);
        return;
      }
    }
    setSelected(null);
  }, [items]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-hud-border">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: country.lng,
          latitude: country.lat,
          zoom: Math.max(country.zoom - 1, 1),
          pitch: 20,
          bearing: 0,
        }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onClick={handleMapClick}
        interactiveLayerIds={["country-points"]}
        fog={{
          color: "#050a12",
          "high-color": "#0a1a3a",
          "horizon-blend": 0.05,
          "space-color": "#020408",
          "star-intensity": 0.6,
        }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        <Source id="country-events" type="geojson" data={geoJSON}>
          <Layer {...glowStyle} />
          <Layer {...pointStyle} />
        </Source>

        {selected && selected.lat && selected.lng && (
          <Popup
            latitude={selected.lat}
            longitude={selected.lng}
            anchor="bottom"
            onClose={() => setSelected(null)}
            closeButton={false}
            className="tactical-popup"
            maxWidth="280px"
            offset={12}
          >
            <div
              className="glass-panel rounded-md p-2.5 min-w-[220px]"
              style={{
                borderLeft: `3px solid ${SEVERITY_COLORS[selected.severity]}`,
                background: `linear-gradient(90deg, ${SEVERITY_COLORS[selected.severity]}08 0%, rgba(5,10,18,0.92) 30%)`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px]">{CATEGORY_ICONS[selected.category]}</span>
                <span
                  className="font-mono text-[8px] font-bold tracking-wider"
                  style={{ color: SEVERITY_COLORS[selected.severity] }}
                >
                  {selected.severity.toUpperCase()}
                </span>
                <span className="font-mono text-[7px] text-hud-muted ml-auto">
                  {timeAgo(selected.publishedAt)}
                </span>
              </div>
              <p className="text-[10px] text-hud-text leading-snug mb-1">
                {selected.title.slice(0, 120)}
              </p>
              {selected.url && (
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[7px] text-hud-accent hover:underline"
                >
                  OPEN →
                </a>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Event count badge */}
      <div className="absolute top-2 left-2 z-10">
        <div className="font-mono text-[8px] text-hud-muted bg-hud-surface/80 backdrop-blur-sm border border-hud-border rounded px-1.5 py-0.5">
          <span className="text-hud-accent">{geoJSON.features.length}</span> geo-located
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/components/country/CountryMiniMap.tsx
git commit -m "feat(country): add CountryMiniMap with event markers and popups"
```

---

## Task 7: Country Navigation Component

**Files:**
- Create: `src/components/country/CountryNav.tsx`
- Create: `tests/unit/country-nav.test.ts`

- [ ] **Step 1: Write failing tests for CountryNav logic**

```typescript
// tests/unit/country-nav.test.ts
import { describe, it, expect } from "vitest";
import { COUNTRIES, REGIONS } from "@/config/countries";

describe("CountryNav data", () => {
  it("has countries for every defined region", () => {
    REGIONS.forEach((region) => {
      const count = COUNTRIES.filter((c) => c.region === region).length;
      expect(count).toBeGreaterThan(0);
    });
  });

  it("every country has valid coordinates", () => {
    COUNTRIES.forEach((c) => {
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lng).toBeGreaterThanOrEqual(-180);
      expect(c.lng).toBeLessThanOrEqual(180);
    });
  });

  it("every country has both name and nameTr", () => {
    COUNTRIES.forEach((c) => {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.nameTr.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify pass (data validation)**

Run: `cd /c/Users/azadu/worldmotion/worldscope && npx vitest run tests/unit/country-nav.test.ts`
Expected: PASS

- [ ] **Step 3: Create CountryNav component**

```typescript
// src/components/country/CountryNav.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { COUNTRIES, REGIONS, type CountryMeta } from "@/config/countries";
import { getFlagEmoji, getNeighborCountries } from "@/lib/utils/country-helpers";

interface CountryNavProps {
  currentCode: string;
}

export function CountryNav({ currentCode }: CountryNavProps) {
  const t = useTranslations("country");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { prev, next } = useMemo(
    () => getNeighborCountries(currentCode),
    [currentCode]
  );

  // Keyboard navigation: left/right arrow for prev/next country
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in search
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        router.push(`/country/${prev.code.toLowerCase()}`);
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        router.push(`/country/${next.code.toLowerCase()}`);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, router]);

  const filteredCountries = useMemo(() => {
    let list = COUNTRIES;
    if (activeRegion) {
      list = list.filter((c) => c.region === activeRegion);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameTr.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeRegion, search]);

  return (
    <div className="space-y-3">
      {/* Prev / Next Navigation */}
      <div className="flex items-center justify-between gap-2">
        {prev ? (
          <Link
            href={`/country/${prev.code.toLowerCase()}`}
            className="flex items-center gap-1.5 bg-hud-surface border border-hud-border rounded-md px-3 py-2 hover:border-hud-muted transition-colors flex-1"
            title={`${t("prevCountry")} (←)`}
          >
            <span className="font-mono text-[10px] text-hud-muted">←</span>
            <span className="text-sm">{getFlagEmoji(prev.code)}</span>
            <span className="font-mono text-[9px] text-hud-text truncate">{prev.name}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        <Link
          href="/"
          className="font-mono text-[8px] text-hud-accent hover:underline px-2 shrink-0"
          title={t("backToDashboard")}
        >
          ◆ GLOBE
        </Link>

        {next ? (
          <Link
            href={`/country/${next.code.toLowerCase()}`}
            className="flex items-center gap-1.5 bg-hud-surface border border-hud-border rounded-md px-3 py-2 hover:border-hud-muted transition-colors flex-1 justify-end"
            title={`${t("nextCountry")} (→)`}
          >
            <span className="font-mono text-[9px] text-hud-text truncate">{next.name}</span>
            <span className="text-sm">{getFlagEmoji(next.code)}</span>
            <span className="font-mono text-[10px] text-hud-muted">→</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full font-mono text-[9px] text-hud-accent tracking-wider hover:underline text-center py-1"
      >
        {isExpanded ? "▲ COLLAPSE" : `▼ ${t("allCountries")} (${COUNTRIES.length})`}
      </button>

      {isExpanded && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Search */}
          <input
            type="text"
            placeholder={t("searchCountry")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-hud-panel border border-hud-border rounded-md px-3 py-1.5 font-mono text-[10px] text-hud-text placeholder:text-hud-muted focus:outline-none focus:border-hud-accent"
          />

          {/* Region tabs */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveRegion(null)}
              className={`font-mono text-[8px] px-2 py-0.5 rounded border transition-all ${
                !activeRegion
                  ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent"
                  : "bg-hud-panel border-hud-border text-hud-muted hover:text-hud-text"
              }`}
            >
              {t("regionAll")}
            </button>
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setActiveRegion(region === activeRegion ? null : region)}
                className={`font-mono text-[8px] px-2 py-0.5 rounded border transition-all ${
                  activeRegion === region
                    ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent"
                    : "bg-hud-panel border-hud-border text-hud-muted hover:text-hud-text"
                }`}
              >
                {region.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Country grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {filteredCountries.map((c) => (
              <Link
                key={c.code}
                href={`/country/${c.code.toLowerCase()}`}
                className={`font-mono text-[9px] px-2 py-1.5 rounded border transition-all ${
                  c.code === currentCode.toUpperCase()
                    ? "bg-hud-accent/10 border-hud-accent/30 text-hud-accent"
                    : "bg-hud-surface border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-muted"
                }`}
              >
                {getFlagEmoji(c.code)} {c.name}
              </Link>
            ))}
          </div>

          {filteredCountries.length === 0 && (
            <p className="text-center font-mono text-[9px] text-hud-muted py-4">
              No countries match "{search}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/components/country/CountryNav.tsx tests/unit/country-nav.test.ts
git commit -m "feat(country): add CountryNav with search, region filter, keyboard prev/next"
```

---

## Task 8: Country Event List Component

**Files:**
- Create: `src/components/country/CountryEventList.tsx`

- [ ] **Step 1: Create filtered event list with infinite scroll**

```typescript
// src/components/country/CountryEventList.tsx
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem, Severity, Category } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";

const PAGE_SIZE = 25;

interface CountryEventListProps {
  items: IntelItem[];
}

export function CountryEventList({ items }: CountryEventListProps) {
  const t = useTranslations("country");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
  }, [items.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Reset when items change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items.length]);

  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  if (items.length === 0) {
    return (
      <div className="bg-hud-surface border border-hud-border rounded-md p-8 text-center">
        <p className="font-mono text-[10px] text-hud-muted">
          {t("noEvents", { name: "" })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("recentIntel")} — {t("eventCount", { count: items.length })}
      </div>

      <div className="space-y-1.5">
        {visible.map((event) => (
          <article
            key={event.id}
            className="bg-hud-surface border border-hud-border rounded-md p-3 hover:border-hud-muted transition-colors group"
          >
            <div className="flex items-start gap-2.5">
              <div className="text-base mt-0.5 shrink-0">
                {CATEGORY_ICONS[event.category] || "📌"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span
                    className="font-mono text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded border"
                    style={{
                      color: SEVERITY_COLORS[event.severity],
                      borderColor: `${SEVERITY_COLORS[event.severity]}40`,
                      backgroundColor: `${SEVERITY_COLORS[event.severity]}10`,
                    }}
                  >
                    {event.severity.toUpperCase()}
                  </span>
                  <span className="font-mono text-[7px] text-hud-muted uppercase">
                    {event.category}
                  </span>
                  <span className="font-mono text-[7px] text-hud-muted ml-auto shrink-0">
                    {timeAgo(event.publishedAt)}
                  </span>
                </div>

                <h3 className="text-[11px] text-hud-text leading-snug mb-0.5">
                  {event.url ? (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-hud-accent transition-colors"
                    >
                      {event.title}
                    </a>
                  ) : (
                    event.title
                  )}
                </h3>

                {event.summary && (
                  <p className="text-[10px] text-hud-muted leading-relaxed line-clamp-2">
                    {event.summary}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  {event.source && (
                    <span className="font-mono text-[7px] text-hud-muted">
                      {event.source}
                    </span>
                  )}
                  {event.lat != null && event.lng != null && (
                    <span className="font-mono text-[6px] text-hud-accent/60">
                      📍 {event.lat.toFixed(2)}°, {event.lng.toFixed(2)}°
                    </span>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {visibleCount < items.length && (
        <div ref={sentinelRef} className="py-3 text-center">
          <span className="font-mono text-[8px] text-hud-muted animate-pulse">◆ LOADING...</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/components/country/CountryEventList.tsx
git commit -m "feat(country): add CountryEventList with infinite scroll and severity badges"
```

---

## Task 9: Country Dashboard Shell (Client Orchestrator)

**Files:**
- Create: `src/components/country/CountryDashboard.tsx`

- [ ] **Step 1: Create the main client shell that wires everything together**

```typescript
// src/components/country/CountryDashboard.tsx
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { CountryMeta } from "@/config/countries";
import { useCountryEvents } from "@/hooks/useCountryEvents";
import { CountryNav } from "./CountryNav";
import { CountryStats } from "./CountryStats";
import { CountryTimeline } from "./CountryTimeline";
import { CountryFilters } from "./CountryFilters";
import { CountryEventList } from "./CountryEventList";
import { getFlagEmoji } from "@/lib/utils/country-helpers";
import Link from "next/link";

/** Lazy-load Mapbox mini-map — heavy dependency */
const CountryMiniMap = dynamic(
  () => import("./CountryMiniMap").then((m) => ({ default: m.CountryMiniMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-hud-panel border border-hud-border rounded-lg flex items-center justify-center">
        <span className="font-mono text-[9px] text-hud-muted animate-pulse">◆ LOADING MAP...</span>
      </div>
    ),
  }
);

interface CountryDashboardProps {
  country: CountryMeta;
}

export function CountryDashboard({ country }: CountryDashboardProps) {
  const t = useTranslations("country");
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [severities, setSeverities] = useState<Set<string>>(new Set());

  const { items, allItems, isLoading } = useCountryEvents({
    countryCode: country.code,
    categories,
    severities,
  });

  const toggleCategory = useCallback((cat: string) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleSeverity = useCallback((sev: string) => {
    setSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setCategories(new Set());
    setSeverities(new Set());
  }, []);

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      {/* Header */}
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-[9px] font-mono text-hud-muted mb-3">
            <Link href="/" className="text-hud-accent hover:underline">WORLDSCOPE</Link>
            <span>/</span>
            <span>{country.region.toUpperCase()}</span>
            <span>/</span>
            <span className="text-hud-text">{country.code}</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-4xl">{getFlagEmoji(country.code)}</div>
            <div className="flex-1">
              <h1 className="font-mono text-xl font-bold text-hud-text tracking-wide">
                {country.name}
              </h1>
              <p className="font-mono text-[10px] text-hud-muted mt-0.5">
                {country.nameTr} • {country.region} • {t("events72h", { count: allItems.length })}
              </p>
            </div>
            {isLoading && (
              <span className="font-mono text-[9px] text-hud-accent animate-pulse">◆ SYNCING...</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation (prev/next + country grid) */}
        <CountryNav currentCode={country.code} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ── Left Column: Map + Filters ── */}
          <div className="lg:col-span-4 space-y-4">
            {/* Mini Map */}
            <div className="h-[280px] lg:h-[320px]">
              <CountryMiniMap country={country} items={allItems} />
            </div>

            {/* Filters */}
            <CountryFilters
              activeCategories={categories}
              activeSeverities={severities}
              onToggleCategory={toggleCategory}
              onToggleSeverity={toggleSeverity}
              onClear={clearFilters}
            />

            {/* Stats */}
            <CountryStats items={items} allItems={allItems} />
          </div>

          {/* ── Right Column: Timeline + Events ── */}
          <div className="lg:col-span-8 space-y-4">
            {/* Timeline */}
            <CountryTimeline items={allItems} />

            {/* Event List */}
            <CountryEventList items={items} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hud-border bg-hud-surface mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="font-mono text-[8px] text-hud-muted">
            WorldScope — Global Intelligence Dashboard
          </p>
          <Link href="/" className="font-mono text-[9px] text-hud-accent hover:underline mt-1 inline-block">
            ← {t("backToDashboard")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/components/country/CountryDashboard.tsx
git commit -m "feat(country): add CountryDashboard shell (map + filters + stats + timeline + events)"
```

---

## Task 10: Rewrite Server Page to Use CountryDashboard

**Files:**
- Modify: `src/app/country/[code]/page.tsx`

- [ ] **Step 1: Slim down the server page — delegate rendering to client components**

Replace the entire file content with:

```typescript
// src/app/country/[code]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES, COUNTRY_MAP } from "@/config/countries";
import { CountryDashboard } from "@/components/country/CountryDashboard";

export async function generateStaticParams() {
  return COUNTRIES.map((c) => ({ code: c.code.toLowerCase() }));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  if (!country) return { title: "Country Not Found — WorldScope" };

  const title = `${country.name} Intelligence Report — WorldScope`;
  const description = `Real-time intelligence monitoring for ${country.name}. Events, threat analysis, and security updates from WorldScope.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  if (!country) notFound();

  return <CountryDashboard country={country} />;
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/app/country/[code]/page.tsx
git commit -m "refactor(country): slim server page, delegate to CountryDashboard client shell"
```

---

## Task 11: API Route — Country Filter Support

**Files:**
- Modify: `src/app/api/intel/route.ts`

- [ ] **Step 1: Add country query param support to /api/intel**

In the existing route handler, after items are aggregated, deduped, and sorted, add country filtering. Find the section right before the `return NextResponse.json(...)` and add:

```typescript
// Country filter (optional query param)
const countryParam = url.searchParams.get("country");
if (countryParam) {
  items = items.filter(
    (i) => i.countryCode?.toUpperCase() === countryParam.toUpperCase()
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add src/app/api/intel/route.ts
git commit -m "feat(api): add ?country= filter param to /api/intel endpoint"
```

---

## Task 12: Build Validation + Full Test Run

- [ ] **Step 1: Run all tests**

Run: `cd /c/Users/azadu/worldmotion/worldscope && npx vitest run`
Expected: All tests PASS (existing 167 + new country tests)

- [ ] **Step 2: Run build**

Run: `cd /c/Users/azadu/worldmotion/worldscope && npm run build`
Expected: Build succeeds with no type errors

- [ ] **Step 3: Run lint**

Run: `cd /c/Users/azadu/worldmotion/worldscope && npm run lint`
Expected: No new errors

- [ ] **Step 4: Final commit**

```bash
cd /c/Users/azadu/worldmotion/worldscope
git add -A
git commit -m "feat(country): complete country pages overhaul — rich dashboard + navigation"
```
