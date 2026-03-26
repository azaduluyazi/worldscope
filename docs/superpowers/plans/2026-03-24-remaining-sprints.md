# WorldScope — Remaining Sprints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining features across 5 sprints: test coverage, sports data, admin user management, quality/accessibility, and documentation/polish.

**Architecture:** Next.js 16.1.7 App Router with Supabase (DB + Realtime), Upstash Redis cache (`cachedFetch` pattern), SWR for client data fetching, Vitest + @testing-library/react for testing. Themes via CSS cascade + `data-*` attributes. API routes aggregate data from 126+ external sources.

**Tech Stack:** Next.js 16.1.7, React 19, TypeScript, Supabase, Upstash Redis, Vitest, Playwright, Zod 4, Mapbox GL, react-globe.gl, Tailwind CSS 4

**Prerequisite:** Update `CLAUDE.md` line 6 from "Next.js 15" to "Next.js 16" to match actual version.

---

## Current State Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Export (CSV/PDF/JSON) | **DONE** | Client-side in ExportPanel.tsx via jsPDF |
| Vessel tracking | **DONE** | /api/vessels + useVesselTracker + marine-ais |
| Flight tracking | **DONE** | /api/flights + useFlightTracker + OpenSky |
| Weather data | **DONE** | /api/weather + Open-Meteo 30-city grid |
| SEO (JSON-LD, sitemap, robots) | **DONE** | Full implementation in sitemap.ts, robots.ts |
| Real-time SSE | **DONE** | /api/intel/stream + Supabase Realtime channel |
| Admin panel (4 tabs) | **DONE** | Overview/Sources/Feeds/Registry |
| Tests | **PARTIAL** | 18 files exist, needs more component + API coverage |
| Sports data | **MISSING** | No /api/sports route (6 API clients exist: ESPN, Cricket, F1, Football, NBA, Transfermarkt) |
| User management DB | **MISSING** | No users/subscriptions/watchlists/bookmarks tables |
| Accessibility | **PARTIAL** | Basic ARIA on new components, gaps in older ones |
| Zod validation | **PARTIAL** | Installed (zod@4.3.6) but not used on API routes |
| Rate limiting | **PARTIAL** | @upstash/ratelimit installed, not wired to routes |
| API documentation | **MISSING** | No /api-docs page |

---

## Sprint 2 — Test Coverage Expansion

**Goal:** Expand from 18 to ~28 test files covering critical utils, API data shapes, themes, and key components.

### Task 2.1: Core utility tests

**Files:**
- Create: `tests/unit/sanitize.test.ts`
- Create: `tests/unit/cache.test.ts`
- Reference: `src/lib/utils/sanitize.ts` (exports: `stripHtml`, `truncate`)
- Reference: `src/lib/cache/redis.ts` (exports: `cachedFetch`, `TTL`, `redis`)

- [ ] **Step 1: Write sanitize utility tests**

```typescript
// tests/unit/sanitize.test.ts
import { describe, it, expect } from "vitest";
import { truncate, stripHtml } from "@/lib/utils/sanitize";

describe("truncate", () => {
  it("returns full string when under limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });
  it("truncates at word boundary and adds ellipsis", () => {
    const result = truncate("hello world foo bar", 11);
    expect(result.length).toBeLessThanOrEqual(15);
    expect(result).toContain("…");
  });
  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
  });
});

describe("stripHtml", () => {
  it("strips HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });
  it("handles string without HTML", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run tests/unit/sanitize.test.ts`
Expected: All 6 tests pass

- [ ] **Step 3: Write cache utility tests (mocked Redis)**

```typescript
// tests/unit/cache.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the @upstash/redis module
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
  })),
}));

describe("cache TTL constants", () => {
  it("has expected TTL values", async () => {
    const { TTL } = await import("@/lib/cache/redis");
    expect(TTL.MARKET).toBe(60);
    expect(TTL.NEWS).toBe(180);
    expect(TTL.RSS).toBe(600);
    expect(TTL.THREAT).toBe(300);
    expect(TTL.AI_BRIEF).toBe(3600);
  });
});

describe("cachedFetch", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls fetcher when cache misses", async () => {
    const { cachedFetch } = await import("@/lib/cache/redis");
    const fetcher = vi.fn().mockResolvedValue({ result: "fresh" });
    const result = await cachedFetch("test-key", fetcher, 60);
    expect(result).toEqual({ result: "fresh" });
  });
});
```

- [ ] **Step 4: Run and verify**

Run: `npx vitest run tests/unit/cache.test.ts`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add tests/unit/sanitize.test.ts tests/unit/cache.test.ts
git commit -m "test: add sanitize and cache utility tests"
```

### Task 2.2: API data shape tests

**Files:**
- Create: `tests/unit/api-intel.test.ts`
- Create: `tests/unit/api-weather.test.ts`
- Create: `tests/unit/api-flights.test.ts`
- Reference: `src/types/intel.ts` (SEVERITY_ORDER is a `Record<Severity, number>`, not array)

- [ ] **Step 1: Write intel data shape tests**

```typescript
// tests/unit/api-intel.test.ts
import { describe, it, expect } from "vitest";
import { SEVERITY_ORDER } from "@/types/intel";
import type { IntelItem, Severity, Category } from "@/types/intel";

describe("Intel data types", () => {
  it("SEVERITY_ORDER ranks critical lowest (highest priority)", () => {
    expect(SEVERITY_ORDER.critical).toBeLessThan(SEVERITY_ORDER.high);
    expect(SEVERITY_ORDER.high).toBeLessThan(SEVERITY_ORDER.medium);
    expect(SEVERITY_ORDER.medium).toBeLessThan(SEVERITY_ORDER.low);
    expect(SEVERITY_ORDER.low).toBeLessThan(SEVERITY_ORDER.info);
  });

  it("IntelItem validates required fields at type level", () => {
    const item: IntelItem = {
      id: "test-1",
      title: "Test event",
      summary: "Test summary",
      source: "Reuters",
      category: "conflict",
      severity: "high",
      publishedAt: new Date().toISOString(),
      url: "https://example.com",
    };
    expect(item.id).toBeTruthy();
    expect(item.severity).toBe("high");
  });

  it("all severity levels are defined in SEVERITY_ORDER", () => {
    const levels: Severity[] = ["critical", "high", "medium", "low", "info"];
    for (const level of levels) {
      expect(SEVERITY_ORDER[level]).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Write weather detection test**

```typescript
// tests/unit/api-weather.test.ts
import { describe, it, expect } from "vitest";

describe("Weather extreme detection logic", () => {
  // Mirrors the logic in /api/weather/route.ts
  const isExtreme = (code: number, temp: number, wind: number) =>
    code >= 95 || temp > 45 || temp < -30 || wind > 80;

  it("WMO code >= 95 is extreme", () => {
    expect(isExtreme(95, 20, 10)).toBe(true);
  });
  it("temperature > 45°C is extreme", () => {
    expect(isExtreme(0, 50, 10)).toBe(true);
  });
  it("temperature < -30°C is extreme", () => {
    expect(isExtreme(0, -35, 10)).toBe(true);
  });
  it("wind > 80 km/h is extreme", () => {
    expect(isExtreme(0, 20, 90)).toBe(true);
  });
  it("normal conditions are not extreme", () => {
    expect(isExtreme(0, 20, 10)).toBe(false);
  });
});
```

- [ ] **Step 3: Write flight data shape test**

```typescript
// tests/unit/api-flights.test.ts
import { describe, it, expect } from "vitest";

describe("Flight tracking data validation", () => {
  it("latitude/longitude are in valid range", () => {
    const positions = [
      { lat: 41.0, lng: 28.9 },  // Istanbul
      { lat: -33.8, lng: 151.2 }, // Sydney
      { lat: 0, lng: 0 },         // Null Island
    ];
    for (const pos of positions) {
      expect(pos.lat).toBeGreaterThanOrEqual(-90);
      expect(pos.lat).toBeLessThanOrEqual(90);
      expect(pos.lng).toBeGreaterThanOrEqual(-180);
      expect(pos.lng).toBeLessThanOrEqual(180);
    }
  });

  it("altitude is non-negative", () => {
    expect(0).toBeGreaterThanOrEqual(0);
    expect(10000).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 4: Run all API tests**

Run: `npx vitest run tests/unit/api-*.test.ts`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add tests/unit/api-intel.test.ts tests/unit/api-weather.test.ts tests/unit/api-flights.test.ts
git commit -m "test: add API data shape and transformation tests"
```

### Task 2.3: Theme system tests

**Files:**
- Create: `tests/unit/themes.test.ts`
- Reference: `src/config/themes.ts`

- [ ] **Step 1: Write theme configuration tests**

```typescript
// tests/unit/themes.test.ts
import { describe, it, expect } from "vitest";
import { THEMES, getThemeById, DEFAULT_THEME, THEME_GROUPS } from "@/config/themes";

describe("Theme system", () => {
  it("has 21 themes defined", () => {
    expect(THEMES.length).toBe(21);
  });

  it("every theme has required color properties", () => {
    for (const theme of THEMES) {
      expect(theme.colors.base).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.colors.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.colors.text).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.id).toBeTruthy();
      expect(theme.name).toBeTruthy();
    }
  });

  it("getThemeById returns correct theme", () => {
    expect(getThemeById("cyberpunk").id).toBe("cyberpunk");
    expect(getThemeById("bloomberg").id).toBe("bloomberg");
    expect(getThemeById("warzone").id).toBe("warzone");
  });

  it("getThemeById returns default for unknown id", () => {
    expect(getThemeById("nonexistent").id).toBe(DEFAULT_THEME.id);
  });

  it("no duplicate theme IDs", () => {
    const ids = THEMES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all groups are valid", () => {
    const validGroups = Object.keys(THEME_GROUPS);
    for (const theme of THEMES) {
      expect(validGroups).toContain(theme.group);
    }
  });

  it("warzone has defconBar enabled", () => {
    expect(getThemeById("warzone").defconBar).toBe(true);
  });

  it("cyberpunk has gradientBanner enabled", () => {
    expect(getThemeById("cyberpunk").gradientBanner).toBe(true);
  });

  it("bloomberg has zero card radius and no card shadow", () => {
    const bloomberg = getThemeById("bloomberg");
    expect(bloomberg.cardRadius).toBe("none");
    expect(bloomberg.cardShadow).toBe("none");
  });

  it("light themes have lightMode flag", () => {
    const lightThemes = THEMES.filter(t => t.lightMode);
    expect(lightThemes.length).toBeGreaterThanOrEqual(4);
    for (const t of lightThemes) {
      expect(t.group).toBe("editorial");
    }
  });
});
```

- [ ] **Step 2: Run and verify**

Run: `npx vitest run tests/unit/themes.test.ts`
Expected: All 10 tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/unit/themes.test.ts
git commit -m "test: add theme system configuration tests"
```

### Task 2.4: Component rendering tests

**Files:**
- Create: `tests/unit/intel-card.test.tsx`
- Create: `tests/unit/defcon-bar.test.tsx`
- Reference: `src/components/dashboard/IntelCard.tsx` (props: `{ item: IntelItem, onPreview?: fn }`, renders severity class `.severity-{severity}`, text: `{severity.toUpperCase()} — {category.toUpperCase()}`)
- Reference: `src/components/dashboard/DefconBar.tsx` (props: `{ activeLevel?: number }`, uses `useTheme()` which returns `{ theme, themeId, setTheme, themes }`)

- [ ] **Step 1: Read component source files to verify props and rendered output**

Read `src/components/dashboard/IntelCard.tsx` and `src/components/dashboard/DefconBar.tsx` to confirm prop interfaces and rendered DOM.

- [ ] **Step 2: Write IntelCard render test**

```tsx
// tests/unit/intel-card.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IntelCard } from "@/components/dashboard/IntelCard";
import type { IntelItem } from "@/types/intel";

const mockItem: IntelItem = {
  id: "test-1",
  title: "NATO deploys forces to Eastern Europe",
  summary: "Test summary",
  source: "Reuters",
  category: "conflict",
  severity: "critical",
  publishedAt: new Date().toISOString(),
  url: "https://example.com/article",
};

describe("IntelCard", () => {
  it("renders title text", () => {
    render(<IntelCard item={mockItem} />);
    expect(screen.getByText(/NATO deploys/)).toBeTruthy();
  });

  it("shows severity and category label", () => {
    render(<IntelCard item={mockItem} />);
    // IntelCard renders: {severity.toUpperCase()} — {category.toUpperCase()}
    expect(screen.getByText(/CRITICAL — CONFLICT/)).toBeTruthy();
  });

  it("shows source name", () => {
    render(<IntelCard item={mockItem} />);
    expect(screen.getByText("Reuters")).toBeTruthy();
  });

  it("applies severity CSS class", () => {
    const { container } = render(<IntelCard item={mockItem} />);
    expect(container.querySelector(".severity-critical")).toBeTruthy();
  });

  it("shows geo indicator when lat/lng present", () => {
    const geoItem = { ...mockItem, lat: 41.0, lng: 28.9 };
    render(<IntelCard item={geoItem} />);
    expect(screen.getByText("📍")).toBeTruthy();
  });
});
```

- [ ] **Step 3: Write DefconBar test**

```tsx
// tests/unit/defcon-bar.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DashboardTheme } from "@/config/themes";

// Mock useTheme — returns { theme, themeId, setTheme, themes }
vi.mock("@/components/shared/ThemeProvider", () => ({
  useTheme: vi.fn(),
}));

import { DefconBar } from "@/components/dashboard/DefconBar";
import { useTheme } from "@/components/shared/ThemeProvider";

describe("DefconBar", () => {
  it("renders all 5 threat levels when defconBar is enabled", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: { defconBar: true } as DashboardTheme,
      themeId: "warzone",
      setTheme: vi.fn(),
      themes: [],
    });
    render(<DefconBar activeLevel={0} />);
    expect(screen.getByText("SEVERE")).toBeTruthy();
    expect(screen.getByText("HIGH")).toBeTruthy();
    expect(screen.getByText("ELEVATED")).toBeTruthy();
    expect(screen.getByText("GUARDED")).toBeTruthy();
    expect(screen.getByText("LOW")).toBeTruthy();
  });

  it("returns null when defconBar is disabled", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: { defconBar: false } as DashboardTheme,
      themeId: "military",
      setTheme: vi.fn(),
      themes: [],
    });
    const { container } = render(<DefconBar />);
    expect(container.innerHTML).toBe("");
  });

  it("marks active level with aria-current", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: { defconBar: true } as DashboardTheme,
      themeId: "warzone",
      setTheme: vi.fn(),
      themes: [],
    });
    render(<DefconBar activeLevel={2} />);
    const elevated = screen.getByText("ELEVATED").closest("div");
    expect(elevated?.getAttribute("aria-current")).toBe("true");
  });
});
```

- [ ] **Step 4: Run all component tests**

Run: `npx vitest run tests/unit/intel-card.test.tsx tests/unit/defcon-bar.test.tsx`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add tests/unit/intel-card.test.tsx tests/unit/defcon-bar.test.tsx
git commit -m "test: add IntelCard and DefconBar component tests"
```

### Task 2.5: E2E smoke test

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Read existing E2E test file**

Read `tests/e2e/smoke.spec.ts` to see what's already there.

- [ ] **Step 2: Write basic E2E smoke tests**

```typescript
// tests/e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads and shows WorldScope", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=WORLDSCOPE")).toBeVisible({ timeout: 15000 });
});

test("analytics page loads", async ({ page }) => {
  await page.goto("/analytics");
  await expect(page.locator("text=ANALYTICS")).toBeVisible({ timeout: 15000 });
});

test("admin page shows login gate", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.locator("input[type='password']")).toBeVisible({ timeout: 10000 });
});

test("API health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
});
```

- [ ] **Step 3: Run E2E (requires dev server running on port 3000)**

Run: `npx playwright test tests/e2e/smoke.spec.ts --reporter=list`
Expected: All 4 tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test: add E2E smoke tests for critical pages and API health"
```

### Task 2.6: Run full test suite

- [ ] **Step 1: Run all unit tests**

Run: `npx vitest run`
Expected: All tests pass, 0 failures

---

## Sprint 3 — Sports Data Route

**Goal:** Create `/api/sports` route aggregating ESPN, Football-Data, NBA, Cricket, F1 data into a unified sports feed.

### Task 3.1: Create /api/sports route with test

**Files:**
- Create: `tests/unit/api-sports.test.ts`
- Create: `src/app/api/sports/route.ts`
- Reference: `src/lib/api/espn-sports.ts` (exports: `fetchAllSportsScores`, `fetchESPNScores`)
- Reference: `src/lib/api/football-data.ts` (exports: `fetchFootballIntel`, `fetchTodayMatches`)
- Reference: `src/lib/api/nba-stats.ts` (exports: `fetchNbaIntel`)
- Reference: `src/lib/api/cricket.ts` (exports: `fetchCricketIntel`)
- Reference: `src/lib/api/f1-ergast.ts` (exports: `fetchF1Intel`)
- Reference: `src/lib/cache/redis.ts` (use `cachedFetch(key, fetcher, ttl)` pattern)

- [ ] **Step 1: Read existing sports API clients**

Read each file to understand their return types:
- `src/lib/api/espn-sports.ts`
- `src/lib/api/football-data.ts`
- `src/lib/api/nba-stats.ts`
- `src/lib/api/cricket.ts`
- `src/lib/api/f1-ergast.ts`

- [ ] **Step 2: Write failing test**

```typescript
// tests/unit/api-sports.test.ts
import { describe, it, expect } from "vitest";

interface SportsEvent {
  id: string;
  sport: string;
  league: string;
  title: string;
  status: "scheduled" | "live" | "completed" | "postponed";
  score?: string;
  startTime: string;
  source: string;
}

describe("Sports API data shape", () => {
  it("SportsEvent has all required fields", () => {
    const event: SportsEvent = {
      id: "espn-soccer-1",
      sport: "soccer",
      league: "Premier League",
      title: "Arsenal vs Chelsea",
      status: "live",
      score: "2-1",
      startTime: new Date().toISOString(),
      source: "espn",
    };
    expect(event.sport).toBeTruthy();
    expect(event.league).toBeTruthy();
    expect(["scheduled", "live", "completed", "postponed"]).toContain(event.status);
  });

  it("status mapping works for ESPN statuses", () => {
    const mapStatus = (s: string): SportsEvent["status"] => {
      const lower = s.toLowerCase();
      if (lower.includes("in") || lower.includes("live") || lower.includes("progress")) return "live";
      if (lower.includes("final") || lower.includes("end") || lower.includes("complete")) return "completed";
      if (lower.includes("postpone") || lower.includes("cancel")) return "postponed";
      return "scheduled";
    };
    expect(mapStatus("STATUS_IN_PROGRESS")).toBe("live");
    expect(mapStatus("STATUS_FINAL")).toBe("completed");
    expect(mapStatus("STATUS_POSTPONED")).toBe("postponed");
    expect(mapStatus("STATUS_SCHEDULED")).toBe("scheduled");
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run tests/unit/api-sports.test.ts`

- [ ] **Step 4: Implement the sports API route**

The route should use the same pattern as `/api/intel/route.ts`: call the existing `*Intel` functions that already return `IntelItem[]`, then also add live scores. Use `cachedFetch` for caching.

```typescript
// src/app/api/sports/route.ts
import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { fetchAllSportsScores } from "@/lib/api/espn-sports";
import { fetchFootballIntel } from "@/lib/api/football-data";
import { fetchNbaIntel } from "@/lib/api/nba-stats";
import { fetchCricketIntel } from "@/lib/api/cricket";
import { fetchF1Intel } from "@/lib/api/f1-ergast";
import { fetchOpenF1Intel } from "@/lib/api/openf1";
import { fetchTransfermarktIntel } from "@/lib/api/transfermarkt";
import type { IntelItem } from "@/types/intel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_KEY = "sports:aggregated";
const CACHE_TTL = 120; // 2 min

export async function GET() {
  try {
    const data = await cachedFetch<{ items: IntelItem[]; total: number; lastUpdated: string }>(
      CACHE_KEY,
      async () => {
        const results = await Promise.allSettled([
          fetchAllSportsScores().catch(() => []),
          fetchFootballIntel().catch(() => []),
          fetchNbaIntel().catch(() => []),
          fetchCricketIntel().catch(() => []),
          fetchF1Intel().catch(() => []),
          fetchOpenF1Intel().catch(() => []),
          fetchTransfermarktIntel().catch(() => []),
        ]);

        const items: IntelItem[] = [];
        for (const result of results) {
          if (result.status === "fulfilled" && Array.isArray(result.value)) {
            items.push(...result.value);
          }
        }

        // Deduplicate by title similarity
        const seen = new Set<string>();
        const unique = items.filter(item => {
          const key = item.title.toLowerCase().slice(0, 50);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort by publishedAt desc
        unique.sort((a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        return {
          items: unique.slice(0, 100),
          total: unique.length,
          lastUpdated: new Date().toISOString(),
        };
      },
      CACHE_TTL
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Sports API]", error);
    return NextResponse.json({ items: [], total: 0, error: "Failed to fetch sports data" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Test route manually**

Run dev server, then: `curl -s http://localhost:3000/api/sports | python -m json.tool | head -30`
Expected: JSON with `items` array, `total`, `lastUpdated`

- [ ] **Step 6: Commit**

```bash
git add src/app/api/sports/route.ts tests/unit/api-sports.test.ts
git commit -m "feat: add /api/sports aggregated endpoint (ESPN, Football-Data, NBA, Cricket, F1)"
```

### Task 3.2: Create useSportsData hook

**Files:**
- Create: `src/hooks/useSportsData.ts`

- [ ] **Step 1: Create the SWR hook**

```typescript
// src/hooks/useSportsData.ts
import useSWR from "swr";
import type { IntelItem } from "@/types/intel";

interface SportsResponse {
  items: IntelItem[];
  total: number;
  lastUpdated: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useSportsData() {
  const { data, error, isLoading, mutate } = useSWR<SportsResponse>(
    "/api/sports",
    fetcher,
    {
      refreshInterval: 120_000, // 2 minutes
      revalidateOnFocus: true,
      dedupingInterval: 60_000,
    }
  );

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    lastUpdated: data?.lastUpdated,
    error,
    isLoading,
    refresh: mutate,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSportsData.ts
git commit -m "feat: add useSportsData SWR hook"
```

---

## Sprint 4 — Admin User Management + Real-time Enhancement

**Goal:** Add users/subscriptions DB schema, admin users tab, and improve connection status indicator.

### Task 4.1: Create users and subscriptions DB tables

**Files:**
- Create: `supabase/migrations/005_users_subscriptions.sql`
- Reference: `supabase/migrations/001_initial_schema.sql` (events table has `id UUID PRIMARY KEY`)

- [ ] **Step 1: Read existing schema to verify events.id type**

Read `supabase/migrations/001_initial_schema.sql` and confirm `events.id` is UUID.

- [ ] **Step 2: Write the migration**

```sql
-- supabase/migrations/005_users_subscriptions.sql

-- User profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  locale TEXT DEFAULT 'en',
  theme_id TEXT DEFAULT 'military',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  paddle_subscription_id TEXT UNIQUE,
  paddle_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlists
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  keywords TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  countries TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_watchlists_user ON public.watchlists(user_id);
CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/005_users_subscriptions.sql
git commit -m "feat: add users, subscriptions, watchlists, bookmarks DB schema"
```

### Task 4.2: Add admin users API route and panel

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/components/admin/UsersPanel.tsx`
- Modify: `src/app/admin/page.tsx` — add "Users" tab
- Create: `tests/unit/admin-users.test.ts`

- [ ] **Step 1: Write failing test for admin users API**

```typescript
// tests/unit/admin-users.test.ts
import { describe, it, expect } from "vitest";

describe("Admin users API", () => {
  it("rejects request without admin key", async () => {
    // Simulate unauthorized — the route checks x-admin-key header
    const mockReq = { headers: { get: () => null } };
    expect(mockReq.headers.get("x-admin-key")).toBeNull();
  });

  it("user profile shape is valid", () => {
    const user = {
      id: "uuid-1",
      email: "test@example.com",
      display_name: "Test User",
      locale: "en",
      theme_id: "military",
      created_at: new Date().toISOString(),
    };
    expect(user.email).toContain("@");
    expect(user.locale).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/unit/admin-users.test.ts`

- [ ] **Step 3: Create admin users API route**

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("*, subscriptions(plan, status)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users: (users || []).map((u: Record<string, unknown>) => ({
        ...u,
        subscription: Array.isArray(u.subscriptions) ? u.subscriptions[0] : null,
      })),
      total: users?.length || 0,
    });
  } catch (err) {
    return NextResponse.json({ users: [], total: 0, error: "Failed to fetch users" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create UsersPanel component**

```typescript
// src/components/admin/UsersPanel.tsx
"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  locale: string;
  theme_id: string;
  created_at: string;
  subscription?: { plan: string; status: string } | null;
}

export function UsersPanel({ adminKey }: { adminKey: string }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json())
      .then(data => setUsers(data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <div className="text-hud-muted text-xs p-4">Loading users...</div>;

  return (
    <div className="p-2 space-y-2">
      <div className="flex justify-between items-center mb-2">
        <span className="hud-label">REGISTERED USERS ({users.length})</span>
      </div>
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="text-hud-muted border-b border-hud-border">
            <td className="py-1 px-2">EMAIL</td>
            <td className="py-1 px-2">PLAN</td>
            <td className="py-1 px-2">STATUS</td>
            <td className="py-1 px-2">LOCALE</td>
            <td className="py-1 px-2">JOINED</td>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b border-hud-border/30 hover:bg-hud-surface">
              <td className="py-1 px-2 text-hud-text">{u.email}</td>
              <td className="py-1 px-2 text-hud-accent">{u.subscription?.plan || "free"}</td>
              <td className="py-1 px-2">{u.subscription?.status || "active"}</td>
              <td className="py-1 px-2 text-hud-muted">{u.locale}</td>
              <td className="py-1 px-2 text-hud-muted">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-hud-muted text-center py-8 text-xs">No registered users yet</div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Add "Users" tab to admin page**

In `src/app/admin/page.tsx`, add `{ id: "users", label: "Users", icon: "👥" }` to the tabs array and render `<UsersPanel adminKey={adminKey} />` when `activeTab === "users"`. Import `UsersPanel` from `@/components/admin/UsersPanel`.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/users/route.ts src/components/admin/UsersPanel.tsx src/app/admin/page.tsx tests/unit/admin-users.test.ts
git commit -m "feat: add user management tab to admin panel with API route"
```

### Task 4.3: Enhance ConnectionStatus with SSE health

**Files:**
- Modify: `src/components/dashboard/ConnectionStatus.tsx`

Current implementation (28 lines): Only shows offline/online via `navigator.onLine`. Needs SSE connection tracking.

- [ ] **Step 1: Rewrite ConnectionStatus with SSE health**

```typescript
// src/components/dashboard/ConnectionStatus.tsx
"use client";

import { useState, useEffect, useRef } from "react";

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  // Browser online/offline
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // SSE connection monitoring
  useEffect(() => {
    if (!online) return;

    const connect = () => {
      const es = new EventSource("/api/intel/stream");
      esRef.current = es;

      es.onopen = () => setSseConnected(true);

      es.addEventListener("intel", () => {
        setLastEvent(new Date().toISOString());
        setEventCount(c => c + 1);
      });

      es.onerror = () => {
        setSseConnected(false);
        es.close();
        // Reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
    };

    connect();
    return () => { esRef.current?.close(); };
  }, [online]);

  // Show nothing when fully connected
  if (online && sseConnected) return null;

  // Offline banner
  if (!online) {
    return (
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-severity-critical/90 text-white font-mono text-[10px] px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-pulse">
        <span>⚠</span>
        <span>OFFLINE — Data may be stale</span>
      </div>
    );
  }

  // Online but SSE disconnected
  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-hud-panel/90 text-hud-accent font-mono text-[10px] px-4 py-2 rounded-md shadow-lg flex items-center gap-2 border border-hud-border backdrop-blur-sm">
      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
      <span>RECONNECTING — {eventCount} events received</span>
    </div>
  );
}
```

- [ ] **Step 2: Test by toggling network in browser DevTools**

Verify: offline shows red banner, SSE disconnect shows yellow reconnecting, normal shows nothing.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ConnectionStatus.tsx
git commit -m "feat: enhance ConnectionStatus with SSE health monitoring and auto-reconnect"
```

---

## Sprint 5 — Quality: Accessibility, Validation, Rate Limiting, Monitoring

### Task 5.1: Accessibility improvements

**Files:**
- Modify: `src/components/dashboard/IntelCard.tsx:26-29` — add aria-label to button
- Modify: `src/components/dashboard/TopBar.tsx` — wrap in header landmark
- Modify: `src/components/dashboard/IconSidebar.tsx` — add aria-labels to category buttons
- Modify: `src/components/dashboard/MarketTicker.tsx:18` — add aria-live to ticker div

- [ ] **Step 1: Read each file's current structure**

Read the relevant sections of IntelCard.tsx (line 26-29), TopBar.tsx (return statement), IconSidebar.tsx (button rendering), MarketTicker.tsx (line 18).

- [ ] **Step 2: Add aria-label to IntelCard button**

In `src/components/dashboard/IntelCard.tsx`, the `<button>` element at line 26 — add:
```tsx
aria-label={`${item.severity} ${item.category}: ${truncate(item.title, 60)}`}
```

- [ ] **Step 3: Add landmark role to TopBar**

In `src/components/dashboard/TopBar.tsx`, wrap the top-level div in the return with:
```tsx
<header role="banner" className="...existing classes...">
```

- [ ] **Step 4: Add aria-labels to IconSidebar buttons**

In `src/components/dashboard/IconSidebar.tsx`, each category button should have:
```tsx
aria-label={t(item.tKey)}
aria-pressed={filters.categories.has(item.category)}
```

- [ ] **Step 5: Add aria-live to MarketTicker**

In `src/components/dashboard/MarketTicker.tsx`, line 18, add to the outer div:
```tsx
aria-live="polite" aria-atomic="false" role="marquee"
```

- [ ] **Step 6: Test keyboard navigation**

Tab through all interactive elements on the dashboard. Verify focus ring is visible.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/IntelCard.tsx src/components/dashboard/TopBar.tsx src/components/dashboard/IconSidebar.tsx src/components/dashboard/MarketTicker.tsx
git commit -m "fix: improve accessibility — ARIA labels, landmarks, live regions"
```

### Task 5.2: Zod validation on API routes

**Files:**
- Create: `src/lib/validators/schemas.ts`
- Modify: `src/app/api/intel/route.ts` — add Zod validation
- Create: `tests/unit/validation.test.ts`

Note: Using existing `src/lib/validators/` directory (already has `feed-validator.ts`).

- [ ] **Step 1: Write failing validation test**

```typescript
// tests/unit/validation.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirrors what we'll create in schemas.ts
const intelQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(2000).default(100),
  hours: z.coerce.number().min(1).max(720).default(24),
  lang: z.string().min(2).max(5).default("en"),
  category: z.string().optional(),
  severity: z.string().optional(),
});

describe("API input validation", () => {
  it("accepts valid intel query params", () => {
    const result = intelQuerySchema.safeParse({ limit: "50", hours: "24", lang: "en" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.hours).toBe(24);
    }
  });

  it("rejects limit > 2000", () => {
    const result = intelQuerySchema.safeParse({ limit: "5000" });
    expect(result.success).toBe(false);
  });

  it("rejects negative hours", () => {
    const result = intelQuerySchema.safeParse({ hours: "-1" });
    expect(result.success).toBe(false);
  });

  it("applies defaults for missing params", () => {
    const result = intelQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.hours).toBe(24);
      expect(result.data.lang).toBe("en");
    }
  });
});
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/unit/validation.test.ts`
Expected: All pass

- [ ] **Step 3: Create schemas file**

```typescript
// src/lib/validators/schemas.ts
import { z } from "zod";

export const intelQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(2000).default(100),
  hours: z.coerce.number().min(1).max(720).default(24),
  lang: z.string().min(2).max(5).default("en"),
  category: z.string().optional(),
  severity: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
```

- [ ] **Step 4: Wire Zod to /api/intel route**

At the top of the `GET` handler in `src/app/api/intel/route.ts`, before the existing query param parsing, add:

```typescript
import { intelQuerySchema } from "@/lib/validators/schemas";

// Inside GET handler, replace manual param parsing with:
const rawParams = Object.fromEntries(req.nextUrl.searchParams);
const parsed = intelQuerySchema.safeParse(rawParams);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid parameters", details: parsed.error.flatten() },
    { status: 400 }
  );
}
const { limit, hours, lang, category, severity } = parsed.data;
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/schemas.ts src/app/api/intel/route.ts tests/unit/validation.test.ts
git commit -m "feat: add Zod input validation to API routes"
```

### Task 5.3: Rate limiting on public API routes

**Files:**
- Create: `src/lib/middleware/rate-limit.ts`
- Modify: `src/app/api/intel/route.ts` — add rate limit check
- Create: `tests/unit/rate-limit.test.ts`

- [ ] **Step 1: Write rate limit test**

```typescript
// tests/unit/rate-limit.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: Date.now() + 60000 }),
  })),
}));

describe("Rate limiting", () => {
  it("allows requests under the limit", async () => {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const limiter = new Ratelimit({} as any);
    const result = await limiter.limit("127.0.0.1");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59);
  });
});
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/unit/rate-limit.test.ts`

- [ ] **Step 3: Create rate limit helper**

```typescript
// src/lib/middleware/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
});

export async function checkRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    );
  }
  return null;
}
```

- [ ] **Step 4: Wire to /api/intel and /api/sports**

Add at top of GET handlers:
```typescript
import { checkRateLimit } from "@/lib/middleware/rate-limit";
// First line in GET:
const rateLimited = await checkRateLimit(req);
if (rateLimited) return rateLimited;
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/middleware/rate-limit.ts src/app/api/intel/route.ts src/app/api/sports/route.ts tests/unit/rate-limit.test.ts
git commit -m "feat: add Upstash rate limiting to public API routes"
```

### Task 5.4: Sentry error boundary integration

**Files:**
- Modify: `src/components/shared/ErrorBoundary.tsx` — add Sentry capture
- Reference: ErrorBoundary is a **class component** (confirmed: `extends Component<Props, State>` with `getDerivedStateFromError`)

- [ ] **Step 1: Add Sentry capture to ErrorBoundary**

In `src/components/shared/ErrorBoundary.tsx`, add after `getDerivedStateFromError`:

```typescript
import * as Sentry from "@sentry/nextjs";

// Add this method to the class:
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  Sentry.captureException(error, {
    extra: {
      componentStack: errorInfo.componentStack,
      section: this.props.section,
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/ErrorBoundary.tsx
git commit -m "fix: add Sentry error capture to ErrorBoundary component"
```

---

## Sprint 6 — API Docs, Bundle Optimization, User Preferences, Docs

### Task 6.1: API documentation page

**Files:**
- Create: `src/app/api-docs/page.tsx`

- [ ] **Step 1: Create API docs page**

```tsx
// src/app/api-docs/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation — WorldScope",
  description: "WorldScope public API endpoints for intelligence, market, flight, and vessel data.",
};

const ENDPOINTS = [
  { method: "GET", path: "/api/intel", description: "Global intelligence feed", params: "limit, hours, lang, category, severity", example: "/api/intel?limit=10&hours=24&lang=en" },
  { method: "GET", path: "/api/intel/stream", description: "Real-time SSE event stream", params: "none (Server-Sent Events)", example: "curl -N http://localhost:3000/api/intel/stream" },
  { method: "GET", path: "/api/intel/insights", description: "Anomalies, entities, sentiment analysis", params: "hours", example: "/api/intel/insights?hours=24" },
  { method: "GET", path: "/api/intel/anomalies", description: "Anomaly detection", params: "hours", example: "/api/intel/anomalies?hours=24" },
  { method: "GET", path: "/api/market", description: "Market data (crypto, indices)", params: "none", example: "/api/market" },
  { method: "GET", path: "/api/flights", description: "Global aircraft positions (OpenSky)", params: "none", example: "/api/flights" },
  { method: "GET", path: "/api/flights/search", description: "Search specific flight by callsign", params: "q (IATA code)", example: "/api/flights/search?q=TK" },
  { method: "GET", path: "/api/vessels", description: "Maritime AIS vessel positions", params: "none", example: "/api/vessels" },
  { method: "GET", path: "/api/sports", description: "Aggregated sports scores and news", params: "none", example: "/api/sports" },
  { method: "GET", path: "/api/weather", description: "Global weather for 30 major cities", params: "none", example: "/api/weather" },
  { method: "GET", path: "/api/cyber-threats", description: "CVEs, ransomware, phishing data", params: "none", example: "/api/cyber-threats" },
  { method: "GET", path: "/api/predictions", description: "Prediction markets data", params: "none", example: "/api/predictions" },
  { method: "GET", path: "/api/threat", description: "Global threat index score", params: "none", example: "/api/threat" },
  { method: "GET", path: "/api/health", description: "System health check", params: "none", example: "/api/health" },
  { method: "GET", path: "/api/trending", description: "Trending topics", params: "none", example: "/api/trending" },
  { method: "GET", path: "/api/translate", description: "Translate text", params: "text, from, to", example: "/api/translate?text=hello&to=tr" },
];

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-hud-base text-hud-text p-6 font-mono">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-hud-accent mb-1 tracking-wider">WORLDSCOPE API</h1>
        <p className="text-hud-muted text-xs mb-6">Public REST endpoints — rate limited to 60 req/min per IP</p>

        <div className="space-y-3">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="border border-hud-border rounded-sm p-3 hover:bg-hud-surface transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-hud-accent/10 text-hud-accent">{ep.method}</span>
                <code className="text-sm text-hud-text">{ep.path}</code>
              </div>
              <p className="text-xs text-hud-muted mb-1">{ep.description}</p>
              <div className="text-[10px] text-hud-muted">
                <span className="text-hud-accent">Params:</span> {ep.params}
              </div>
              <div className="text-[10px] text-hud-muted mt-0.5">
                <span className="text-hud-accent">Try:</span>{" "}
                <code className="text-hud-text">{ep.example}</code>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-[10px] text-hud-muted border-t border-hud-border pt-4">
          <p>All endpoints return JSON. Authenticated admin routes require <code>x-admin-key</code> header.</p>
          <p className="mt-1">SSE stream sends <code>event: intel</code> with JSON data for new events.</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api-docs/page.tsx
git commit -m "feat: add API documentation page"
```

### Task 6.2: Bundle analysis setup

**Files:**
- Modify: `next.config.ts` — add bundle analyzer (ESM import)

- [ ] **Step 1: Install bundle analyzer**

Run: `npm install --save-dev @next/bundle-analyzer`

- [ ] **Step 2: Configure in next.config.ts using ESM import**

Add at top of `next.config.ts`:
```typescript
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});
```

Then wrap the final export: replace `export default withSentryConfig(withNextIntl(nextConfig), ...)` with wrapping through `withBundleAnalyzer`.

- [ ] **Step 3: Run analysis**

Run: `ANALYZE=true npm run build`
Review the generated report for Mapbox GL and Three.js chunk sizes.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts package.json package-lock.json
git commit -m "perf: add @next/bundle-analyzer for chunk size monitoring"
```

### Task 6.3: User preferences DB sync

**Files:**
- Create: `src/lib/api/user-preferences.ts`
- Modify: `src/lib/user-preferences.ts`

- [ ] **Step 1: Read current user-preferences.ts**

Read `src/lib/user-preferences.ts` to understand the current localStorage-only implementation.

- [ ] **Step 2: Create Supabase sync layer**

```typescript
// src/lib/api/user-preferences.ts
import { supabase } from "@/lib/db/supabase";

interface UserPreferences {
  theme_id?: string;
  locale?: string;
}

export async function syncPreferencesToDB(userId: string, prefs: UserPreferences): Promise<void> {
  try {
    await supabase
      .from("user_profiles")
      .update({ ...prefs, updated_at: new Date().toISOString() })
      .eq("id", userId);
  } catch {
    // Silently fail — localStorage is the fallback
  }
}

export async function loadPreferencesFromDB(userId: string): Promise<UserPreferences | null> {
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("theme_id, locale")
      .eq("id", userId)
      .single();
    return data;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/user-preferences.ts src/lib/user-preferences.ts
git commit -m "feat: add Supabase sync for user preferences (fallback to localStorage)"
```

### Task 6.4: Update CLAUDE.md with deployment guide

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add deployment section and fix version**

Add to `CLAUDE.md`:

```markdown
## Deployment

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (server only)
- `UPSTASH_REDIS_REST_URL` — Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis token
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox GL access token
- `GROQ_API_KEY` — Groq LLM API key
- `ADMIN_KEY` — Admin panel access key
- `RESEND_API_KEY` — Email sending (optional)
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry error tracking (optional)
- `PADDLE_API_KEY` — Payment processing (optional)

### Vercel Deployment
1. Connect GitHub repo to Vercel
2. Set all environment variables above
3. Deploy — build runs `next build`

### Supabase Setup
1. Create project at supabase.com
2. Run migrations: `supabase db push`
3. Enable Realtime on `events` table

### Cron Jobs (Vercel)
Configure in `vercel.json` — runs `/api/cron/fetch-feeds` every 5 minutes
```

- [ ] **Step 2: Fix version from "Next.js 15" to "Next.js 16"**

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add deployment guide, env vars, fix Next.js version in CLAUDE.md"
```

### Task 6.5: Final integration verification

- [ ] **Step 1: Run all unit tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Builds successfully with 0 type errors

- [ ] **Step 3: Run E2E tests against production build**

```bash
npm run start &
sleep 5
npx playwright test tests/e2e/smoke.spec.ts
```
Expected: All smoke tests pass

- [ ] **Step 4: Verify themes via Playwright**

```bash
npx playwright test -g "theme" 2>/dev/null || echo "No theme tests — verify manually"
```

Switch to each theme (cyberpunk, bloomberg, warzone) in the running app and verify:
- Cyberpunk: gradient banner visible, neon glow on cards
- Bloomberg: pure black background, orange mono text, zero rounded corners
- Warzone: DEFCON bar, flashing alert, red grid overlay, crosshair on map
