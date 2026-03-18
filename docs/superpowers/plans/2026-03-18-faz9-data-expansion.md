# Faz 9: Data Expansion — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand WorldScope's data layer from 315 feeds / 11 API clients to 500+ feeds / 18 API clients, add a feed health monitoring dashboard, automated feed validation, and Vercel Cron background fetching.

**Architecture:** New API clients follow the existing pattern in `src/lib/api/` — each exports a `fetch*()` function returning `IntelItem[]` or `MarketQuote[]`. Feeds expansion adds Turkish, regional, and niche sources to `src/config/feeds.ts`. The feed health dashboard is a new Next.js page at `/feeds` with HUD theme. Vercel Cron uses `vercel.json` crons config to trigger `/api/cron/fetch-feeds` on a schedule.

**Tech Stack:** Next.js 16 App Router, Supabase PostgreSQL, Upstash Redis, Vercel Cron, SWR, Tailwind CSS + shadcn/ui

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/api/openweathermap.ts` | Weather alerts API client |
| `src/lib/api/exchangerate.ts` | Forex rates API client (free tier) |
| `src/lib/api/spaceflight.ts` | Spaceflight News API client |
| `src/lib/api/flightradar.ts` | Aviation incidents API client |
| `src/lib/api/acled.ts` | ACLED conflict data API client |
| `src/lib/api/reliefweb.ts` | UN OCHA ReliefWeb disasters client |
| `src/lib/api/newsdata.ts` | NewsData.io news aggregator client |
| `src/lib/validators/feed-validator.ts` | RSS feed URL validation + health check |
| `src/app/feeds/page.tsx` | Feed health monitoring dashboard page |
| `src/app/feeds/layout.tsx` | Feeds page layout with metadata |
| `src/hooks/useFeedHealth.ts` | SWR hook for feed health data |
| `src/components/feeds/FeedHealthTable.tsx` | Sortable feed table component |
| `src/components/feeds/FeedCategoryChart.tsx` | Category distribution bar chart |
| `src/components/feeds/FeedStatusBadge.tsx` | Feed status indicator component |
| `src/app/api/cron/fetch-feeds/route.ts` | Vercel Cron: background feed fetcher |
| `src/app/api/cron/validate-feeds/route.ts` | Vercel Cron: feed health validator |
| `tests/unit/feed-validator.test.ts` | Feed validator unit tests |
| `tests/unit/api-clients-new.test.ts` | New API client unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `src/config/feeds.ts` | Add ~200 new feeds (Turkish, regional, specialized) |
| `src/app/api/intel/route.ts` | Wire in 7 new API clients to aggregation pipeline |
| `src/lib/db/feed-health.ts` | Add `validateFeed()` and `bulkValidate()` functions |
| `src/types/intel.ts` | Add `source_api` field to IntelItem for tracking |
| `vercel.json` | Add crons configuration |
| `src/app/layout.tsx` | Add /feeds link to navigation metadata |

---

## Task 1: New API Client — ReliefWeb (UN OCHA Disasters)

**Files:**
- Create: `src/lib/api/reliefweb.ts`
- Test: `tests/unit/api-clients-new.test.ts`

ReliefWeb is the UN's humanitarian information service — free, no API key, returns structured disaster/crisis data with coordinates.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/api-clients-new.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("ReliefWeb API Client", () => {
  beforeEach(() => {
    vi.stubEnv("RELIEFWEB_ENABLED", "true");
  });

  it("should export fetchReliefWebDisasters function", async () => {
    const { fetchReliefWebDisasters } = await import("@/lib/api/reliefweb");
    expect(typeof fetchReliefWebDisasters).toBe("function");
  });

  it("should return IntelItem array structure", async () => {
    const mockResponse = {
      data: [
        {
          id: "12345",
          fields: {
            title: "Earthquake in Turkey",
            body: "A 6.2 magnitude earthquake struck eastern Turkey",
            url_alias: "https://reliefweb.int/report/turkiye/earthquake",
            source: [{ name: "OCHA" }],
            date: { created: "2026-03-18T10:00:00+00:00" },
            primary_country: { iso3: "TUR", name: "Turkiye", location: { lat: 39.0, lon: 35.0 } },
            disaster_type: [{ name: "Earthquake" }],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchReliefWebDisasters } = await import("@/lib/api/reliefweb");
    const items = await fetchReliefWebDisasters();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toMatchObject({
      title: expect.any(String),
      source: expect.any(String),
      category: expect.any(String),
      severity: expect.any(String),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/api-clients-new.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ReliefWeb client**

```typescript
// src/lib/api/reliefweb.ts
import type { IntelItem, Severity } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

const RELIEFWEB_API = "https://api.reliefweb.int/v1/reports";

interface ReliefWebReport {
  id: string;
  fields: {
    title: string;
    body?: string;
    url_alias?: string;
    source?: { name: string }[];
    date?: { created: string };
    primary_country?: {
      iso3: string;
      name: string;
      location?: { lat: number; lon: number };
    };
    disaster_type?: { name: string }[];
  };
}

const DISASTER_SEVERITY: Record<string, Severity> = {
  Earthquake: "high",
  Flood: "high",
  "Tropical Cyclone": "critical",
  Epidemic: "critical",
  Drought: "medium",
  "Cold Wave": "medium",
  "Heat Wave": "medium",
  Volcano: "high",
  Tsunami: "critical",
  Wildfire: "high",
};

function mapCategory(disasterTypes: { name: string }[] | undefined): string {
  if (!disasterTypes?.length) return "diplomacy";
  const type = disasterTypes[0].name;
  if (["Earthquake", "Flood", "Tropical Cyclone", "Drought", "Volcano", "Tsunami", "Wildfire", "Cold Wave", "Heat Wave"].includes(type)) return "natural";
  if (["Epidemic"].includes(type)) return "health";
  return "diplomacy";
}

function mapSeverity(disasterTypes: { name: string }[] | undefined): Severity {
  if (!disasterTypes?.length) return "medium";
  return DISASTER_SEVERITY[disasterTypes[0].name] || "medium";
}

export async function fetchReliefWebDisasters(limit = 20): Promise<IntelItem[]> {
  return cachedFetch<IntelItem[]>(`reliefweb:disasters:${limit}`, async () => {
    const params = new URLSearchParams({
      "appname": "worldscope",
      "filter[field]": "date.created",
      "filter[value][from]": new Date(Date.now() - 7 * 86400000).toISOString(),
      "fields[include][]": "title,body,url_alias,source,date,primary_country,disaster_type",
      "sort[]": "date.created:desc",
      "limit": String(limit),
    });

    const res = await fetch(`${RELIEFWEB_API}?${params}`);
    if (!res.ok) return [];

    const json = await res.json();
    const reports: ReliefWebReport[] = json.data || [];

    return reports.map((r) => ({
      id: `reliefweb-${r.id}`,
      title: r.fields.title,
      summary: r.fields.body?.slice(0, 300) || "",
      url: r.fields.url_alias || `https://reliefweb.int/node/${r.id}`,
      source: r.fields.source?.[0]?.name || "ReliefWeb",
      category: mapCategory(r.fields.disaster_type) as IntelItem["category"],
      severity: mapSeverity(r.fields.disaster_type),
      publishedAt: r.fields.date?.created || new Date().toISOString(),
      lat: r.fields.primary_country?.location?.lat,
      lng: r.fields.primary_country?.location?.lon,
      countryCode: r.fields.primary_country?.iso3?.slice(0, 2),
    }));
  }, TTL.NEWS);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/api-clients-new.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/reliefweb.ts tests/unit/api-clients-new.test.ts
git commit -m "feat(api): add ReliefWeb UN OCHA disaster reports client"
```

---

## Task 2: New API Client — ACLED Conflict Data

**Files:**
- Create: `src/lib/api/acled.ts`
- Modify: `tests/unit/api-clients-new.test.ts`

ACLED (Armed Conflict Location & Event Data) provides real-time geo-coded conflict events — battles, protests, explosions, violence.

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/api-clients-new.test.ts`:

```typescript
describe("ACLED API Client", () => {
  it("should export fetchAcledEvents function", async () => {
    const { fetchAcledEvents } = await import("@/lib/api/acled");
    expect(typeof fetchAcledEvents).toBe("function");
  });

  it("should map ACLED event types to categories and severity", async () => {
    const mockResponse = {
      data: [
        {
          event_id_cnty: "IRQ12345",
          event_date: "2026-03-17",
          event_type: "Battles",
          sub_event_type: "Armed clash",
          actor1: "Military Forces",
          country: "Iraq",
          latitude: "33.3",
          longitude: "44.4",
          notes: "Armed clash between military forces and insurgent group",
          fatalities: "5",
          source: "Al Jazeera",
          iso: 368,
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchAcledEvents } = await import("@/lib/api/acled");
    const items = await fetchAcledEvents();
    expect(items[0].category).toBe("conflict");
    expect(items[0].lat).toBe(33.3);
    expect(items[0].lng).toBe(44.4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/api-clients-new.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ACLED client**

```typescript
// src/lib/api/acled.ts
import type { IntelItem, Severity } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

const ACLED_API = "https://api.acleddata.com/acled/read";

interface AcledEvent {
  event_id_cnty: string;
  event_date: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  country: string;
  latitude: string;
  longitude: string;
  notes: string;
  fatalities: string;
  source: string;
  iso: number;
}

const EVENT_SEVERITY: Record<string, Severity> = {
  "Battles": "high",
  "Explosions/Remote violence": "critical",
  "Violence against civilians": "critical",
  "Protests": "medium",
  "Riots": "high",
  "Strategic developments": "low",
};

const EVENT_CATEGORY: Record<string, string> = {
  "Battles": "conflict",
  "Explosions/Remote violence": "conflict",
  "Violence against civilians": "conflict",
  "Protests": "protest",
  "Riots": "protest",
  "Strategic developments": "diplomacy",
};

export async function fetchAcledEvents(limit = 30): Promise<IntelItem[]> {
  const key = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!key || !email) return [];

  return cachedFetch<IntelItem[]>(`acled:events:${limit}`, async () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const params = new URLSearchParams({
      key,
      email,
      event_date: weekAgo,
      event_date_where: ">=",
      limit: String(limit),
    });

    const res = await fetch(`${ACLED_API}?${params}`);
    if (!res.ok) return [];

    const json = await res.json();
    const events: AcledEvent[] = json.data || [];

    return events.map((e) => {
      const fatalities = parseInt(e.fatalities) || 0;
      let severity = EVENT_SEVERITY[e.event_type] || "medium";
      if (fatalities >= 50) severity = "critical";
      else if (fatalities >= 10) severity = "high";

      return {
        id: `acled-${e.event_id_cnty}`,
        title: `${e.event_type}: ${e.sub_event_type} in ${e.country}`,
        summary: e.notes?.slice(0, 300) || "",
        url: `https://acleddata.com/dashboard/#/dashboard`,
        source: e.source || "ACLED",
        category: (EVENT_CATEGORY[e.event_type] || "conflict") as IntelItem["category"],
        severity,
        publishedAt: new Date(e.event_date).toISOString(),
        lat: parseFloat(e.latitude) || undefined,
        lng: parseFloat(e.longitude) || undefined,
      };
    });
  }, TTL.NEWS);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/api-clients-new.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/acled.ts tests/unit/api-clients-new.test.ts
git commit -m "feat(api): add ACLED conflict event data client"
```

---

## Task 3: New API Clients — OpenWeatherMap, Spaceflight, ExchangeRate, FlightRadar, NewsData

**Files:**
- Create: `src/lib/api/openweathermap.ts`
- Create: `src/lib/api/spaceflight.ts`
- Create: `src/lib/api/exchangerate.ts`
- Create: `src/lib/api/flightradar.ts`
- Create: `src/lib/api/newsdata.ts`

These are simpler clients. Implement all five in one task.

- [ ] **Step 1: Write failing tests for all five**

Append to `tests/unit/api-clients-new.test.ts`:

```typescript
describe("OpenWeatherMap Alerts Client", () => {
  it("should export fetchWeatherAlerts function", async () => {
    const { fetchWeatherAlerts } = await import("@/lib/api/openweathermap");
    expect(typeof fetchWeatherAlerts).toBe("function");
  });
});

describe("Spaceflight News Client", () => {
  it("should export fetchSpaceflightNews function", async () => {
    const { fetchSpaceflightNews } = await import("@/lib/api/spaceflight");
    expect(typeof fetchSpaceflightNews).toBe("function");
  });

  it("should return items from free Spaceflight News API", async () => {
    const mockResponse = {
      results: [
        {
          id: 1234,
          title: "SpaceX Launches Starship",
          summary: "SpaceX successfully launched Starship on its test flight",
          url: "https://spaceflightnewsapi.net/article/1234",
          news_site: "SpaceNews",
          published_at: "2026-03-18T08:00:00Z",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchSpaceflightNews } = await import("@/lib/api/spaceflight");
    const items = await fetchSpaceflightNews();
    expect(items[0].category).toBe("tech");
    expect(items[0].source).toBe("SpaceNews");
  });
});

describe("ExchangeRate Client", () => {
  it("should export fetchExchangeRates function", async () => {
    const { fetchExchangeRates } = await import("@/lib/api/exchangerate");
    expect(typeof fetchExchangeRates).toBe("function");
  });
});

describe("FlightRadar Incidents Client", () => {
  it("should export fetchAviationIncidents function", async () => {
    const { fetchAviationIncidents } = await import("@/lib/api/flightradar");
    expect(typeof fetchAviationIncidents).toBe("function");
  });
});

describe("NewsData Client", () => {
  it("should export fetchNewsData function", async () => {
    const { fetchNewsData } = await import("@/lib/api/newsdata");
    expect(typeof fetchNewsData).toBe("function");
  });
});
```

- [ ] **Step 2: Implement OpenWeatherMap alerts client**

```typescript
// src/lib/api/openweathermap.ts
import type { IntelItem, Severity } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

const OWM_API = "https://api.openweathermap.org/data/3.0/onecall";

const ALERT_SEVERITY: Record<string, Severity> = {
  extreme: "critical",
  severe: "high",
  moderate: "medium",
  minor: "low",
};

// Monitor key cities: Istanbul, London, NYC, Tokyo, Mumbai, Sydney, São Paulo
const CITIES = [
  { lat: 41.01, lon: 28.98, name: "Istanbul" },
  { lat: 51.51, lon: -0.13, name: "London" },
  { lat: 40.71, lon: -74.01, name: "New York" },
  { lat: 35.68, lon: 139.69, name: "Tokyo" },
  { lat: 19.08, lon: 72.88, name: "Mumbai" },
];

export async function fetchWeatherAlerts(): Promise<IntelItem[]> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) return [];

  return cachedFetch<IntelItem[]>("owm:alerts", async () => {
    const results: IntelItem[] = [];

    for (const city of CITIES) {
      try {
        const res = await fetch(
          `${OWM_API}?lat=${city.lat}&lon=${city.lon}&exclude=minutely,hourly,daily&appid=${apiKey}`
        );
        if (!res.ok) continue;
        const json = await res.json();

        for (const alert of json.alerts || []) {
          results.push({
            id: `owm-${city.name}-${alert.start}`,
            title: `Weather Alert: ${alert.event} in ${city.name}`,
            summary: alert.description?.slice(0, 300) || "",
            url: `https://openweathermap.org/city/${city.lat},${city.lon}`,
            source: alert.sender_name || "OpenWeatherMap",
            category: "natural",
            severity: ALERT_SEVERITY[alert.tags?.[0]?.toLowerCase()] || "medium",
            publishedAt: new Date(alert.start * 1000).toISOString(),
            lat: city.lat,
            lng: city.lon,
          });
        }
      } catch { /* skip city on error */ }
    }

    return results;
  }, TTL.THREAT); // 5-minute TTL for weather alerts
}
```

- [ ] **Step 3: Implement Spaceflight News client (free, no API key)**

```typescript
// src/lib/api/spaceflight.ts
import type { IntelItem } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

const SNAPI = "https://api.spaceflightnewsapi.net/v4/articles";

interface SpaceflightArticle {
  id: number;
  title: string;
  summary: string;
  url: string;
  news_site: string;
  published_at: string;
  image_url?: string;
}

export async function fetchSpaceflightNews(limit = 15): Promise<IntelItem[]> {
  return cachedFetch<IntelItem[]>(`spaceflight:news:${limit}`, async () => {
    const res = await fetch(`${SNAPI}?limit=${limit}&ordering=-published_at`);
    if (!res.ok) return [];

    const json = await res.json();
    const articles: SpaceflightArticle[] = json.results || [];

    return articles.map((a) => ({
      id: `snapi-${a.id}`,
      title: a.title,
      summary: a.summary?.slice(0, 300) || "",
      url: a.url,
      source: a.news_site,
      category: "tech" as const,
      severity: "info" as const,
      publishedAt: a.published_at,
      imageUrl: a.image_url,
    }));
  }, TTL.NEWS);
}
```

- [ ] **Step 4: Implement ExchangeRate client (free tier)**

```typescript
// src/lib/api/exchangerate.ts
import type { MarketQuote } from "@/types/market";
import { cachedFetch, TTL } from "@/lib/cache/redis";

const API = "https://api.exchangerate-api.com/v4/latest/USD";

const TRACKED_PAIRS = ["EUR", "GBP", "JPY", "TRY", "CNY", "CHF", "AUD", "CAD", "INR", "BRL"];

export async function fetchExchangeRates(): Promise<MarketQuote[]> {
  return cachedFetch<MarketQuote[]>("exchangerate:usd", async () => {
    const res = await fetch(API);
    if (!res.ok) return [];

    const json = await res.json();
    const rates: Record<string, number> = json.rates || {};

    return TRACKED_PAIRS
      .filter((c) => rates[c])
      .map((c) => ({
        symbol: `USD/${c}`,
        name: `US Dollar / ${c}`,
        price: rates[c],
        change: 0, // Free tier has no change data
        changePct: 0,
        currency: c,
      }));
  }, TTL.MARKET);
}
```

- [ ] **Step 5: Implement Aviation incidents client (Aviation Herald RSS)**

```typescript
// src/lib/api/flightradar.ts
import type { IntelItem, Severity } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

// Uses Aviation Safety Network + Aviation Herald RSS as data source
const ASN_RSS = "https://aviation-safety.net/rss/recent.xml";

export async function fetchAviationIncidents(): Promise<IntelItem[]> {
  return cachedFetch<IntelItem[]>("aviation:incidents", async () => {
    try {
      const res = await fetch(ASN_RSS);
      if (!res.ok) return [];

      const xml = await res.text();
      // Simple XML parser for RSS items
      const items: IntelItem[] = [];
      const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const item of itemMatches.slice(0, 15)) {
        const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const desc = item.match(/<description>(.*?)<\/description>/)?.[1] || "";
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

        const isFatal = /fatal|crash|killed|dead/i.test(title + desc);
        const severity: Severity = isFatal ? "critical" : /incident|emergency/i.test(title) ? "high" : "medium";

        items.push({
          id: `asn-${Buffer.from(link).toString("base64url").slice(0, 20)}`,
          title: title.replace(/<!\[CDATA\[|\]\]>/g, ""),
          summary: desc.replace(/<!\[CDATA\[|\]\]>/g, "").slice(0, 300),
          url: link,
          source: "Aviation Safety Network",
          category: "aviation",
          severity,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        });
      }

      return items;
    } catch {
      return [];
    }
  }, TTL.NEWS);
}
```

- [ ] **Step 6: Implement NewsData.io client**

```typescript
// src/lib/api/newsdata.ts
import type { IntelItem, Severity, Category } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

const NEWSDATA_API = "https://newsdata.io/api/1/latest";

interface NewsDataArticle {
  article_id: string;
  title: string;
  description: string;
  link: string;
  source_id: string;
  pubDate: string;
  country: string[];
  category: string[];
  image_url?: string;
  sentiment?: string;
}

const CATEGORY_MAP: Record<string, Category> = {
  politics: "diplomacy",
  business: "finance",
  technology: "tech",
  science: "tech",
  health: "health",
  environment: "natural",
  world: "conflict",
  top: "conflict",
  crime: "conflict",
  sports: "diplomacy",
  entertainment: "diplomacy",
};

function mapSeverity(sentiment?: string): Severity {
  if (sentiment === "negative") return "high";
  if (sentiment === "positive") return "low";
  return "medium";
}

export async function fetchNewsData(limit = 20): Promise<IntelItem[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) return [];

  return cachedFetch<IntelItem[]>(`newsdata:latest:${limit}`, async () => {
    const params = new URLSearchParams({
      apikey: apiKey,
      language: "en,tr",
      size: String(limit),
    });

    const res = await fetch(`${NEWSDATA_API}?${params}`);
    if (!res.ok) return [];

    const json = await res.json();
    const articles: NewsDataArticle[] = json.results || [];

    return articles.map((a) => ({
      id: `newsdata-${a.article_id}`,
      title: a.title,
      summary: a.description?.slice(0, 300) || "",
      url: a.link,
      source: a.source_id,
      category: CATEGORY_MAP[a.category?.[0]] || "diplomacy",
      severity: mapSeverity(a.sentiment),
      publishedAt: a.pubDate || new Date().toISOString(),
      imageUrl: a.image_url,
    }));
  }, TTL.NEWS);
}
```

- [ ] **Step 7: Run all tests**

Run: `npx vitest run tests/unit/api-clients-new.test.ts`
Expected: ALL PASS

- [ ] **Step 8: Commit all new clients**

```bash
git add src/lib/api/openweathermap.ts src/lib/api/spaceflight.ts src/lib/api/exchangerate.ts src/lib/api/flightradar.ts src/lib/api/newsdata.ts tests/unit/api-clients-new.test.ts
git commit -m "feat(api): add 5 new API clients — weather, spaceflight, forex, aviation, newsdata"
```

---

## Task 4: Expand RSS Feeds to 500+

**Files:**
- Modify: `src/config/feeds.ts` — Add ~200 new feeds

The current 315 feeds need expansion with: Turkish sources (30+), Asia-Pacific (20+), Africa (15+), Latin America (15+), Middle East (15+), Specialized tech (20+), Specialized finance (20+), Health & science (15+), Energy & climate (15+), Aviation & maritime (15+), Protest & human rights (10+).

- [ ] **Step 1: Add Turkish-language feeds (30+)**

Append to the `conflict` section of `SEED_FEEDS`:

```typescript
// ── Turkish Sources (30+) ─────────────────────────────────────
{ name: "TRT Haber", url: "https://www.trthaber.com/xml_mobile.rss", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Hürriyet Dünya", url: "https://www.hurriyet.com.tr/rss/dunya", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Sabah Gündem", url: "https://www.sabah.com.tr/rss/gundem.xml", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Milliyet Dünya", url: "https://www.milliyet.com.tr/rss/rssnew/dunyanewsoneminute.xml", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Habertürk", url: "https://www.haberturk.com/rss/gundem.xml", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "NTV", url: "https://www.ntv.com.tr/gundem.rss", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "CNN Türk", url: "https://www.cnnturk.com/feed/rss/all/news", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Sözcü", url: "https://www.sozcu.com.tr/feeds-rss-category-gundem", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/son_dakika.xml", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Yeni Şafak", url: "https://www.yenisafak.com/rss?xml=gundem", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Anadolu Ajansı TR", url: "https://www.aa.com.tr/tr/rss/default?cat=gundem", category: "conflict", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "BloombergHT", url: "https://www.bloomberght.com/rss", category: "finance", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Dünya Gazetesi", url: "https://www.dunya.com/rss", category: "finance", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "Paraanaliz", url: "https://www.paraanaliz.com/feed/", category: "finance", defaultSeverity: "low", language: "tr", region: "turkey" },
{ name: "Shiftdelete Tech", url: "https://shiftdelete.net/feed", category: "tech", defaultSeverity: "info", language: "tr", region: "turkey" },
{ name: "Webrazzi", url: "https://webrazzi.com/feed/", category: "tech", defaultSeverity: "info", language: "tr", region: "turkey" },
{ name: "Sağlık Bakanlığı", url: "https://www.saglik.gov.tr/rss.aspx", category: "health", defaultSeverity: "medium", language: "tr", region: "turkey" },
{ name: "AFAD", url: "https://www.afad.gov.tr/rss.aspx", category: "natural", defaultSeverity: "high", language: "tr", region: "turkey" },
{ name: "Enerji Günlüğü", url: "https://www.enerjigunlugu.net/feed", category: "energy", defaultSeverity: "low", language: "tr", region: "turkey" },
{ name: "BirGün", url: "https://www.birgun.net/rss", category: "protest", defaultSeverity: "medium", language: "tr", region: "turkey" },
```

- [ ] **Step 2: Add Asia-Pacific regional feeds (20+)**

```typescript
// ── Asia-Pacific Regional ────────────────────────────────────
{ name: "South China Morning Post", url: "https://www.scmp.com/rss/91/feed", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "Nikkei Asia", url: "https://asia.nikkei.com/rss/feed/nar", category: "finance", defaultSeverity: "medium", region: "asia" },
{ name: "The Diplomat", url: "https://thediplomat.com/feed/", category: "diplomacy", defaultSeverity: "medium", region: "asia" },
{ name: "Asia Times", url: "https://asiatimes.com/feed/", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "Channel News Asia", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "The Hindu", url: "https://www.thehindu.com/news/international/feeder/default.rss", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "NDTV World", url: "https://feeds.feedburner.com/ndtvnews-world-news", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "Dawn Pakistan", url: "https://www.dawn.com/feeds/home", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "Kyodo News", url: "https://english.kyodonews.net/rss/all.xml", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "Bangkok Post", url: "https://www.bangkokpost.com/rss/data/topstories.xml", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "Jakarta Post", url: "https://www.thejakartapost.com/feed", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "Korea Herald", url: "https://www.koreaherald.com/common/rss_xml.php", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "Vietnam News", url: "https://vietnamnews.vn/rss/politics.rss", category: "diplomacy", defaultSeverity: "low", region: "asia" },
{ name: "Taiwan News", url: "https://www.taiwannews.com.tw/en/rss", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "Strait Times Asia", url: "https://www.straitstimes.com/news/asia/rss.xml", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "ABC Australia", url: "https://www.abc.net.au/news/feed/2942460/rss.xml", category: "conflict", defaultSeverity: "medium", region: "asia" },
{ name: "SCMP Tech", url: "https://www.scmp.com/rss/36/feed", category: "tech", defaultSeverity: "info", region: "asia" },
{ name: "TechNode China", url: "https://technode.com/feed/", category: "tech", defaultSeverity: "info", region: "asia" },
{ name: "KrASIA", url: "https://kr-asia.com/feed", category: "tech", defaultSeverity: "info", region: "asia" },
{ name: "Nikkei Finance", url: "https://asia.nikkei.com/rss/feed/nar", category: "finance", defaultSeverity: "medium", region: "asia" },
```

- [ ] **Step 3: Add Africa, Latin America, and Middle East regional feeds (45+)**

```typescript
// ── Africa Regional ──────────────────────────────────────────
{ name: "AllAfrica", url: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf", category: "conflict", defaultSeverity: "medium", region: "africa" },
{ name: "The Africa Report", url: "https://www.theafricareport.com/feed/", category: "conflict", defaultSeverity: "medium", region: "africa" },
{ name: "African Arguments", url: "https://africanarguments.org/feed/", category: "diplomacy", defaultSeverity: "medium", region: "africa" },
{ name: "Daily Maverick", url: "https://www.dailymaverick.co.za/feed/", category: "conflict", defaultSeverity: "medium", region: "africa" },
{ name: "The East African", url: "https://www.theeastafrican.co.ke/tea/rss", category: "conflict", defaultSeverity: "medium", region: "africa" },
{ name: "Punch Nigeria", url: "https://punchng.com/feed/", category: "conflict", defaultSeverity: "medium", region: "africa" },
{ name: "IOL South Africa", url: "https://www.iol.co.za/cmlink/1.640", category: "conflict", defaultSeverity: "medium", region: "africa" },
{ name: "Citizen Tanzania", url: "https://www.thecitizen.co.tz/feeds/news", category: "conflict", defaultSeverity: "medium", region: "africa" },
{ name: "ISS Africa", url: "https://issafrica.org/feed", category: "conflict", defaultSeverity: "medium", region: "africa" },
{ name: "Africa Confidential", url: "https://www.africa-confidential.com/rss", category: "diplomacy", defaultSeverity: "medium", region: "africa" },
{ name: "Quartz Africa", url: "https://qz.com/africa/feed/", category: "finance", defaultSeverity: "low", region: "africa" },
{ name: "TechCabal Africa", url: "https://techcabal.com/feed/", category: "tech", defaultSeverity: "info", region: "africa" },
{ name: "Disrupt Africa", url: "https://disrupt-africa.com/feed/", category: "tech", defaultSeverity: "info", region: "africa" },
{ name: "Africa Energy", url: "https://www.africa-energy.com/rss", category: "energy", defaultSeverity: "low", region: "africa" },

// ── Latin America ────────────────────────────────────────────
{ name: "Reuters LatAm", url: "https://www.reuters.com/places/latin-america?format=rss", category: "conflict", defaultSeverity: "medium", region: "latam" },
{ name: "Americas Quarterly", url: "https://www.americasquarterly.org/feed/", category: "diplomacy", defaultSeverity: "medium", region: "latam" },
{ name: "Latin Finance", url: "https://www.latinfinance.com/rss", category: "finance", defaultSeverity: "medium", region: "latam" },
{ name: "Buenos Aires Times", url: "https://www.batimes.com.ar/feed/", category: "conflict", defaultSeverity: "medium", region: "latam" },
{ name: "MercoPress", url: "https://en.mercopress.com/rss/", category: "diplomacy", defaultSeverity: "low", region: "latam" },
{ name: "Colombia Reports", url: "https://colombiareports.com/feed/", category: "conflict", defaultSeverity: "medium", region: "latam" },
{ name: "BNamericas", url: "https://www.bnamericas.com/en/rss", category: "finance", defaultSeverity: "low", region: "latam" },
{ name: "NACLA", url: "https://nacla.org/feed", category: "protest", defaultSeverity: "medium", region: "latam" },
{ name: "TechCrunch LatAm", url: "https://techcrunch.com/tag/latin-america/feed/", category: "tech", defaultSeverity: "info", region: "latam" },
{ name: "Mongabay LatAm", url: "https://news.mongabay.com/feed/", category: "natural", defaultSeverity: "medium", region: "latam" },

// ── Middle East ──────────────────────────────────────────────
{ name: "Middle East Eye", url: "https://www.middleeasteye.net/rss", category: "conflict", defaultSeverity: "medium", region: "middleeast" },
{ name: "The National UAE", url: "https://www.thenationalnews.com/rss", category: "conflict", defaultSeverity: "medium", region: "middleeast" },
{ name: "Arab News", url: "https://www.arabnews.com/rss.xml", category: "conflict", defaultSeverity: "medium", region: "middleeast" },
{ name: "Times of Israel", url: "https://www.timesofisrael.com/feed/", category: "conflict", defaultSeverity: "medium", region: "middleeast" },
{ name: "Gulf News", url: "https://gulfnews.com/rss/uae", category: "conflict", defaultSeverity: "medium", region: "middleeast" },
{ name: "Iran International", url: "https://www.iranintl.com/en/feed", category: "conflict", defaultSeverity: "medium", region: "middleeast" },
{ name: "Haaretz", url: "https://www.haaretz.com/cmlink/1.628752", category: "conflict", defaultSeverity: "medium", region: "middleeast" },
{ name: "Daily Star Lebanon", url: "https://www.dailystar.com.lb/rss.aspx", category: "conflict", defaultSeverity: "medium", region: "middleeast" },
{ name: "Middle East Monitor", url: "https://www.middleeastmonitor.com/feed/", category: "conflict", defaultSeverity: "medium", region: "middleeast" },
{ name: "Al-Monitor", url: "https://www.al-monitor.com/rss", category: "diplomacy", defaultSeverity: "medium", region: "middleeast" },
{ name: "Zawya Finance ME", url: "https://www.zawya.com/en/rss", category: "finance", defaultSeverity: "low", region: "middleeast" },
```

- [ ] **Step 4: Add specialized tech, finance, health, energy, and science feeds (60+)**

```typescript
// ── Specialized Tech (20+) ───────────────────────────────────
{ name: "Hacker News", url: "https://hnrss.org/frontpage", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "Wired", url: "https://www.wired.com/feed/rss", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "VentureBeat", url: "https://venturebeat.com/feed/", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "The Information", url: "https://www.theinformation.com/feed", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "Protocol", url: "https://www.protocol.com/feeds/feed.rss", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "TechTarget Security", url: "https://www.techtarget.com/searchsecurity/rss/ContentSyndication.xml", category: "cyber", defaultSeverity: "medium", region: "global" },
{ name: "Dark Reading", url: "https://www.darkreading.com/rss.xml", category: "cyber", defaultSeverity: "medium", region: "global" },
{ name: "SecurityWeek", url: "https://www.securityweek.com/feed/", category: "cyber", defaultSeverity: "medium", region: "global" },
{ name: "CSO Online", url: "https://www.csoonline.com/feed/", category: "cyber", defaultSeverity: "medium", region: "global" },
{ name: "InfoSecurity Mag", url: "https://www.infosecurity-magazine.com/rss/news/", category: "cyber", defaultSeverity: "medium", region: "global" },
{ name: "SC Magazine", url: "https://www.scmagazine.com/feed/", category: "cyber", defaultSeverity: "medium", region: "global" },
{ name: "IEEE Spectrum", url: "https://spectrum.ieee.org/feeds/feed.rss", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "Nature Tech", url: "https://www.nature.com/subjects/technology.rss", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "Science Daily Tech", url: "https://www.sciencedaily.com/rss/computers_math.xml", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "ZDNet", url: "https://www.zdnet.com/news/rss.xml", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "Computerworld", url: "https://www.computerworld.com/feed/", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "Engadget", url: "https://www.engadget.com/rss.xml", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "9to5Mac", url: "https://9to5mac.com/feed/", category: "tech", defaultSeverity: "info", region: "global" },
{ name: "Android Authority", url: "https://www.androidauthority.com/feed/", category: "tech", defaultSeverity: "info", region: "global" },

// ── Specialized Finance (20+) ────────────────────────────────
{ name: "Financial Times", url: "https://www.ft.com/rss/home", category: "finance", defaultSeverity: "medium", region: "global" },
{ name: "Economist", url: "https://www.economist.com/finance-and-economics/rss.xml", category: "finance", defaultSeverity: "medium", region: "global" },
{ name: "Investopedia", url: "https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline", category: "finance", defaultSeverity: "low", region: "global" },
{ name: "Seeking Alpha", url: "https://seekingalpha.com/feed.xml", category: "finance", defaultSeverity: "low", region: "global" },
{ name: "Zero Hedge", url: "https://feeds.feedburner.com/zerohedge/feed", category: "finance", defaultSeverity: "medium", region: "global" },
{ name: "Reuters Business", url: "https://feeds.reuters.com/reuters/businessNews", category: "finance", defaultSeverity: "medium", region: "global" },
{ name: "Barrons", url: "https://www.barrons.com/articles/rss", category: "finance", defaultSeverity: "medium", region: "global" },
{ name: "FXStreet", url: "https://www.fxstreet.com/rss/news", category: "finance", defaultSeverity: "low", region: "global" },
{ name: "DailyFX", url: "https://www.dailyfx.com/feeds/market-news", category: "finance", defaultSeverity: "low", region: "global" },
{ name: "The Block Crypto", url: "https://www.theblock.co/rss.xml", category: "finance", defaultSeverity: "low", region: "global" },
{ name: "CoinTelegraph", url: "https://cointelegraph.com/rss", category: "finance", defaultSeverity: "low", region: "global" },
{ name: "DeFi Pulse", url: "https://defipulse.com/feed", category: "finance", defaultSeverity: "info", region: "global" },
{ name: "Wolf Street", url: "https://wolfstreet.com/feed/", category: "finance", defaultSeverity: "medium", region: "global" },
{ name: "Naked Capitalism", url: "https://www.nakedcapitalism.com/feed", category: "finance", defaultSeverity: "medium", region: "global" },
{ name: "IMF Blog", url: "https://blogs.imf.org/feed/", category: "finance", defaultSeverity: "medium", region: "global" },
{ name: "World Bank Blogs", url: "https://blogs.worldbank.org/feed", category: "finance", defaultSeverity: "medium", region: "global" },
{ name: "BIS Speeches", url: "https://www.bis.org/doclist/speeches.rss", category: "finance", defaultSeverity: "low", region: "global" },
{ name: "Fed Reserve News", url: "https://www.federalreserve.gov/feeds/press_all.xml", category: "finance", defaultSeverity: "medium", region: "us" },

// ── Health & Science (15+) ───────────────────────────────────
{ name: "STAT News", url: "https://www.statnews.com/feed/", category: "health", defaultSeverity: "medium", region: "global" },
{ name: "Science Magazine", url: "https://www.science.org/rss/news_current.xml", category: "health", defaultSeverity: "info", region: "global" },
{ name: "Nature Medicine", url: "https://www.nature.com/nm.rss", category: "health", defaultSeverity: "info", region: "global" },
{ name: "New Scientist", url: "https://www.newscientist.com/feed/home/", category: "health", defaultSeverity: "info", region: "global" },
{ name: "Medical Xpress", url: "https://medicalxpress.com/rss-feed/", category: "health", defaultSeverity: "info", region: "global" },
{ name: "CIDRAP", url: "https://www.cidrap.umn.edu/feed", category: "health", defaultSeverity: "high", region: "global" },
{ name: "Outbreak News Today", url: "http://outbreaknewstoday.com/feed/", category: "health", defaultSeverity: "high", region: "global" },
{ name: "Global Health NOW", url: "https://www.globalhealthnow.org/rss", category: "health", defaultSeverity: "medium", region: "global" },
{ name: "Health Affairs", url: "https://www.healthaffairs.org/action/showFeed?type=etoc&feed=rss", category: "health", defaultSeverity: "low", region: "global" },
{ name: "Kaiser Health News", url: "https://khn.org/feed/", category: "health", defaultSeverity: "medium", region: "us" },
{ name: "Fierce Pharma", url: "https://www.fiercepharma.com/rss/xml", category: "health", defaultSeverity: "low", region: "global" },

// ── Energy & Climate (15+) ───────────────────────────────────
{ name: "Carbon Brief", url: "https://www.carbonbrief.org/feed/", category: "energy", defaultSeverity: "medium", region: "global" },
{ name: "CleanTechnica", url: "https://cleantechnica.com/feed/", category: "energy", defaultSeverity: "info", region: "global" },
{ name: "Electrek", url: "https://electrek.co/feed/", category: "energy", defaultSeverity: "info", region: "global" },
{ name: "Energy Monitor", url: "https://www.energymonitor.ai/feed/", category: "energy", defaultSeverity: "medium", region: "global" },
{ name: "Utility Dive", url: "https://www.utilitydive.com/feeds/news/", category: "energy", defaultSeverity: "low", region: "global" },
{ name: "Renewable Energy World", url: "https://www.renewableenergyworld.com/feed/", category: "energy", defaultSeverity: "low", region: "global" },
{ name: "Nuclear Engineering Intl", url: "https://www.neimagazine.com/rss", category: "energy", defaultSeverity: "medium", region: "global" },
{ name: "Climate Home News", url: "https://www.climatechangenews.com/feed/", category: "natural", defaultSeverity: "medium", region: "global" },
{ name: "Inside Climate News", url: "https://insideclimatenews.org/feed/", category: "natural", defaultSeverity: "medium", region: "global" },
{ name: "The Energy Mix", url: "https://www.theenergymix.com/feed/", category: "energy", defaultSeverity: "low", region: "global" },
{ name: "GreenBiz", url: "https://www.greenbiz.com/rss.xml", category: "energy", defaultSeverity: "info", region: "global" },

// ── Aviation & Maritime (10+) ────────────────────────────────
{ name: "Simple Flying", url: "https://simpleflying.com/feed/", category: "aviation", defaultSeverity: "info", region: "global" },
{ name: "The Points Guy Aviation", url: "https://thepointsguy.com/aviation/feed/", category: "aviation", defaultSeverity: "info", region: "global" },
{ name: "gCaptain Maritime", url: "https://gcaptain.com/feed/", category: "aviation", defaultSeverity: "medium", region: "global" },
{ name: "Splash Maritime", url: "https://splash247.com/feed/", category: "aviation", defaultSeverity: "medium", region: "global" },
{ name: "TradeWinds Maritime", url: "https://www.tradewindsnews.com/rss", category: "aviation", defaultSeverity: "low", region: "global" },
{ name: "Hellenic Shipping News", url: "https://www.hellenicshippingnews.com/feed/", category: "aviation", defaultSeverity: "low", region: "global" },
{ name: "Seatrade Maritime", url: "https://www.seatrade-maritime.com/rss.xml", category: "aviation", defaultSeverity: "low", region: "global" },
{ name: "Lloyd's List", url: "https://lloydslist.maritimeintelligence.informa.com/rss", category: "aviation", defaultSeverity: "medium", region: "global" },
{ name: "Airways Magazine", url: "https://airwaysmag.com/feed/", category: "aviation", defaultSeverity: "info", region: "global" },
```

- [ ] **Step 5: Run feed config tests**

Run: `npx vitest run tests/unit/feeds-config.test.ts`
Expected: PASS — total feeds > 500, all URLs valid, no duplicates

- [ ] **Step 6: Commit feed expansion**

```bash
git add src/config/feeds.ts
git commit -m "feat(feeds): expand RSS feeds from 315 to 500+ — add Turkish, regional, specialized sources"
```

---

## Task 5: Feed Validator

**Files:**
- Create: `src/lib/validators/feed-validator.ts`
- Test: `tests/unit/feed-validator.test.ts`

Validates RSS feed URLs by attempting a HEAD request and checking content type.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/feed-validator.test.ts
import { describe, it, expect, vi } from "vitest";
import { validateFeedUrl, classifyFeedStatus, type FeedValidationResult } from "@/lib/validators/feed-validator";

describe("Feed Validator", () => {
  it("classifyFeedStatus: healthy on 200 with xml content", () => {
    const result = classifyFeedStatus(200, "application/xml");
    expect(result.status).toBe("healthy");
    expect(result.isValid).toBe(true);
  });

  it("classifyFeedStatus: healthy on 200 with rss+xml content", () => {
    const result = classifyFeedStatus(200, "application/rss+xml");
    expect(result.status).toBe("healthy");
  });

  it("classifyFeedStatus: broken on 404", () => {
    const result = classifyFeedStatus(404, "text/html");
    expect(result.status).toBe("broken");
    expect(result.isValid).toBe(false);
  });

  it("classifyFeedStatus: degraded on 200 with text/html (might be paywall)", () => {
    const result = classifyFeedStatus(200, "text/html");
    expect(result.status).toBe("degraded");
  });

  it("classifyFeedStatus: timeout on 408 or 504", () => {
    expect(classifyFeedStatus(408, "").status).toBe("timeout");
    expect(classifyFeedStatus(504, "").status).toBe("timeout");
  });

  it("classifyFeedStatus: rate_limited on 429", () => {
    const result = classifyFeedStatus(429, "");
    expect(result.status).toBe("rate_limited");
  });

  it("should block SSRF attempts", () => {
    expect(() => validateFeedUrl("http://127.0.0.1/rss")).toThrow("SSRF");
    expect(() => validateFeedUrl("http://localhost/rss")).toThrow("SSRF");
    expect(() => validateFeedUrl("http://169.254.169.254/")).toThrow("SSRF");
    expect(() => validateFeedUrl("http://192.168.1.1/rss")).toThrow("SSRF");
  });

  it("should accept valid external URLs", () => {
    expect(() => validateFeedUrl("https://feeds.reuters.com/reuters/worldNews")).not.toThrow();
    expect(() => validateFeedUrl("https://www.bbc.co.uk/news/rss.xml")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feed-validator.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement feed validator**

```typescript
// src/lib/validators/feed-validator.ts

export type FeedStatus = "healthy" | "broken" | "degraded" | "timeout" | "rate_limited" | "unknown";

export interface FeedValidationResult {
  status: FeedStatus;
  isValid: boolean;
  httpStatus?: number;
  contentType?: string;
  responseTimeMs?: number;
  error?: string;
}

const SSRF_PATTERNS = [
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/localhost/,
  /^https?:\/\/\[::1\]/,
  /\.internal(\/|$)/,
  /\.local(\/|$)/,
];

const XML_CONTENT_TYPES = [
  "application/xml",
  "text/xml",
  "application/rss+xml",
  "application/atom+xml",
  "application/rdf+xml",
];

export function validateFeedUrl(url: string): void {
  for (const pattern of SSRF_PATTERNS) {
    if (pattern.test(url)) {
      throw new Error(`SSRF: Blocked private/internal URL: ${url}`);
    }
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error(`Invalid protocol: ${parsed.protocol}`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("SSRF")) throw e;
    throw new Error(`Invalid URL: ${url}`);
  }
}

export function classifyFeedStatus(httpStatus: number, contentType: string): FeedValidationResult {
  if (httpStatus === 408 || httpStatus === 504 || httpStatus === 522 || httpStatus === 524) {
    return { status: "timeout", isValid: false, httpStatus, contentType };
  }

  if (httpStatus === 429) {
    return { status: "rate_limited", isValid: true, httpStatus, contentType };
  }

  if (httpStatus >= 400) {
    return { status: "broken", isValid: false, httpStatus, contentType };
  }

  if (httpStatus >= 200 && httpStatus < 300) {
    const isXml = XML_CONTENT_TYPES.some((t) => contentType.includes(t));
    if (isXml) {
      return { status: "healthy", isValid: true, httpStatus, contentType };
    }
    // 200 but not XML — might be paywall redirect or HTML error page
    return { status: "degraded", isValid: false, httpStatus, contentType };
  }

  return { status: "unknown", isValid: false, httpStatus, contentType };
}

export async function checkFeed(url: string): Promise<FeedValidationResult> {
  validateFeedUrl(url);

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "WorldScope/1.0 Feed Validator" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") || "";
    const result = classifyFeedStatus(res.status, contentType);
    result.responseTimeMs = Date.now() - start;
    return result;
  } catch (err) {
    return {
      status: "timeout",
      isValid: false,
      responseTimeMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function bulkValidate(
  urls: string[],
  concurrency = 10
): Promise<Map<string, FeedValidationResult>> {
  const results = new Map<string, FeedValidationResult>();
  const queue = [...urls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift()!;
      results.set(url, await checkFeed(url));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/feed-validator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/feed-validator.ts tests/unit/feed-validator.test.ts
git commit -m "feat(validator): add RSS feed URL validator with SSRF protection"
```

---

## Task 6: Wire New API Clients into Intel Aggregation

**Files:**
- Modify: `src/app/api/intel/route.ts`

Add the 7 new API clients to the Promise.allSettled aggregation pipeline.

- [ ] **Step 1: Add imports for new clients**

At the top of `src/app/api/intel/route.ts`, add:

```typescript
import { fetchReliefWebDisasters } from "@/lib/api/reliefweb";
import { fetchAcledEvents } from "@/lib/api/acled";
import { fetchWeatherAlerts } from "@/lib/api/openweathermap";
import { fetchSpaceflightNews } from "@/lib/api/spaceflight";
import { fetchAviationIncidents } from "@/lib/api/flightradar";
import { fetchNewsData } from "@/lib/api/newsdata";
```

- [ ] **Step 2: Add new sources to the Promise.allSettled array**

Find the existing `Promise.allSettled([...])` block and add the 6 new fetchers:

```typescript
// Add to the existing allSettled array:
fetchReliefWebDisasters(20),    // UN OCHA disasters
fetchAcledEvents(30),           // Armed conflict data
fetchWeatherAlerts(),           // Weather alerts (key cities)
fetchSpaceflightNews(15),       // Space news
fetchAviationIncidents(),       // Aviation incidents
fetchNewsData(20),              // NewsData.io aggregator
```

- [ ] **Step 3: Test build**

Run: `npm run build`
Expected: Build succeeds with new imports

- [ ] **Step 4: Commit**

```bash
git add src/app/api/intel/route.ts
git commit -m "feat(intel): wire 6 new API clients into aggregation pipeline"
```

---

## Task 7: Feed Health Dashboard Page

**Files:**
- Create: `src/app/feeds/page.tsx`
- Create: `src/app/feeds/layout.tsx`
- Create: `src/hooks/useFeedHealth.ts`
- Create: `src/components/feeds/FeedHealthTable.tsx`
- Create: `src/components/feeds/FeedCategoryChart.tsx`
- Create: `src/components/feeds/FeedStatusBadge.tsx`

A monitoring dashboard at `/feeds` showing all feeds with status, last fetch time, error counts, and category distribution — military HUD theme.

- [ ] **Step 1: Create SWR hook for feed health data**

```typescript
// src/hooks/useFeedHealth.ts
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FeedHealthData {
  total: number;
  active: number;
  unhealthy: number;
  deactivated: number;
  byCategory: Record<string, { active: number; total: number }>;
  timestamp: string;
}

interface FeedListData {
  feeds: Array<{
    id: string;
    name: string;
    url: string;
    category: string;
    is_active: boolean;
    error_count: number;
    last_fetched_at: string | null;
    created_at: string;
  }>;
  total: number;
  healthy: number;
}

export function useFeedHealth() {
  return useSWR<FeedHealthData>("/api/feeds/health", fetcher, {
    refreshInterval: 30_000,
  });
}

export function useFeedList(category?: string) {
  const params = category ? `?category=${category}` : "";
  return useSWR<FeedListData>(`/api/feeds${params}`, fetcher, {
    refreshInterval: 60_000,
  });
}
```

- [ ] **Step 2: Create FeedStatusBadge component**

```typescript
// src/components/feeds/FeedStatusBadge.tsx
"use client";

interface Props {
  errorCount: number;
  isActive: boolean;
  lastFetched: string | null;
}

export function FeedStatusBadge({ errorCount, isActive, lastFetched }: Props) {
  if (!isActive) {
    return <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 font-mono">OFFLINE</span>;
  }
  if (errorCount >= 3) {
    return <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400 font-mono">DEGRADED</span>;
  }
  if (!lastFetched) {
    return <span className="px-2 py-0.5 text-xs rounded bg-gray-500/20 text-gray-400 font-mono">PENDING</span>;
  }
  return <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-400 font-mono">ACTIVE</span>;
}
```

- [ ] **Step 3: Create FeedCategoryChart component**

```typescript
// src/components/feeds/FeedCategoryChart.tsx
"use client";

import { CATEGORY_COLORS } from "@/types/intel";

interface Props {
  byCategory: Record<string, { active: number; total: number }>;
}

export function FeedCategoryChart({ byCategory }: Props) {
  const categories = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);
  const maxTotal = Math.max(...categories.map(([, v]) => v.total), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-mono text-cyan-500 uppercase tracking-wider">Feed Distribution</h3>
      {categories.map(([cat, { active, total }]) => (
        <div key={cat} className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-400 w-20 truncate uppercase">{cat}</span>
          <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden relative">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${(total / maxTotal) * 100}%`,
                backgroundColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || "#00e5ff",
                opacity: 0.6,
              }}
            />
            <div
              className="h-full rounded absolute top-0 left-0 transition-all"
              style={{
                width: `${(active / maxTotal) * 100}%`,
                backgroundColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || "#00e5ff",
              }}
            />
          </div>
          <span className="text-xs font-mono text-gray-500 w-16 text-right">
            {active}/{total}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create FeedHealthTable component**

```typescript
// src/components/feeds/FeedHealthTable.tsx
"use client";

import { useState, useMemo } from "react";
import { FeedStatusBadge } from "./FeedStatusBadge";

interface Feed {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  error_count: number;
  last_fetched_at: string | null;
  created_at: string;
}

interface Props {
  feeds: Feed[];
}

type SortField = "name" | "category" | "error_count" | "last_fetched_at";

export function FeedHealthTable({ feeds }: Props) {
  const [sortField, setSortField] = useState<SortField>("error_count");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set(feeds.map((f) => f.category));
    return ["all", ...Array.from(cats).sort()];
  }, [feeds]);

  const filteredFeeds = useMemo(() => {
    let result = [...feeds];
    if (filterCategory !== "all") result = result.filter((f) => f.category === filterCategory);
    if (filterStatus === "active") result = result.filter((f) => f.is_active);
    if (filterStatus === "inactive") result = result.filter((f) => !f.is_active);
    if (filterStatus === "degraded") result = result.filter((f) => f.error_count >= 3 && f.is_active);

    result.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [feeds, filterCategory, filterStatus, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-xs font-mono rounded px-3 py-1.5"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c.toUpperCase()}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-xs font-mono rounded px-3 py-1.5"
        >
          <option value="all">ALL STATUS</option>
          <option value="active">ACTIVE</option>
          <option value="inactive">OFFLINE</option>
          <option value="degraded">DEGRADED</option>
        </select>
        <span className="text-xs font-mono text-gray-500 self-center ml-auto">
          {filteredFeeds.length} / {feeds.length} feeds
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-gray-700 text-gray-500 uppercase">
              <th className="text-left py-2 px-2 cursor-pointer hover:text-cyan-500" onClick={() => toggleSort("name")}>
                Name {sortField === "name" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className="text-left py-2 px-2 cursor-pointer hover:text-cyan-500" onClick={() => toggleSort("category")}>
                Category {sortField === "category" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className="text-center py-2 px-2">Status</th>
              <th className="text-right py-2 px-2 cursor-pointer hover:text-cyan-500" onClick={() => toggleSort("error_count")}>
                Errors {sortField === "error_count" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className="text-right py-2 px-2 cursor-pointer hover:text-cyan-500" onClick={() => toggleSort("last_fetched_at")}>
                Last Fetch {sortField === "last_fetched_at" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFeeds.map((feed) => (
              <tr key={feed.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-2 px-2 text-gray-300 max-w-[200px] truncate" title={feed.url}>
                  {feed.name}
                </td>
                <td className="py-2 px-2 text-gray-400 uppercase">{feed.category}</td>
                <td className="py-2 px-2 text-center">
                  <FeedStatusBadge
                    errorCount={feed.error_count}
                    isActive={feed.is_active}
                    lastFetched={feed.last_fetched_at}
                  />
                </td>
                <td className="py-2 px-2 text-right text-gray-400">
                  <span className={feed.error_count >= 3 ? "text-red-400" : ""}>{feed.error_count}</span>
                </td>
                <td className="py-2 px-2 text-right text-gray-500">
                  {feed.last_fetched_at
                    ? new Date(feed.last_fetched_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—"
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create feeds page layout**

```typescript
// src/app/feeds/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed Health Monitor | WorldScope",
  description: "Real-time monitoring of 500+ intelligence data feeds across 10 categories",
};

export default function FeedsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 6: Create feeds dashboard page**

```typescript
// src/app/feeds/page.tsx
"use client";

import { useFeedHealth, useFeedList } from "@/hooks/useFeedHealth";
import { FeedHealthTable } from "@/components/feeds/FeedHealthTable";
import { FeedCategoryChart } from "@/components/feeds/FeedCategoryChart";
import Link from "next/link";

export default function FeedsPage() {
  const { data: health, isLoading: healthLoading } = useFeedHealth();
  const { data: feedList, isLoading: listLoading } = useFeedList();

  return (
    <div className="min-h-screen bg-[#050a12] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-cyan-500 hover:text-cyan-400 text-sm font-mono">
              ← DASHBOARD
            </Link>
            <h1 className="text-lg font-mono font-bold tracking-wider text-cyan-500">
              FEED HEALTH MONITOR
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-gray-500">
              LAST UPDATE: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "—"}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="TOTAL FEEDS"
            value={health?.total ?? 0}
            loading={healthLoading}
          />
          <StatCard
            label="ACTIVE"
            value={health?.active ?? 0}
            color="text-emerald-400"
            loading={healthLoading}
          />
          <StatCard
            label="UNHEALTHY"
            value={health?.unhealthy ?? 0}
            color="text-yellow-400"
            loading={healthLoading}
          />
          <StatCard
            label="OFFLINE"
            value={health?.deactivated ?? 0}
            color="text-red-400"
            loading={healthLoading}
          />
        </div>

        {/* Category Distribution */}
        {health?.byCategory && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <FeedCategoryChart byCategory={health.byCategory} />
          </div>
        )}

        {/* Feed Table */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <h3 className="text-xs font-mono text-cyan-500 uppercase tracking-wider mb-4">
            All Feeds
          </h3>
          {listLoading ? (
            <div className="text-center py-8 text-gray-500 font-mono text-sm animate-pulse">
              LOADING FEED DATA...
            </div>
          ) : feedList?.feeds ? (
            <FeedHealthTable feeds={feedList.feeds} />
          ) : (
            <div className="text-center py-8 text-gray-500 font-mono text-sm">
              NO FEED DATA AVAILABLE
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-cyan-400", loading }: {
  label: string;
  value: number;
  color?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-mono font-bold mt-1 ${loading ? "animate-pulse text-gray-600" : color}`}>
        {loading ? "—" : value}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Test build**

Run: `npm run build`
Expected: Build succeeds with new page

- [ ] **Step 8: Commit**

```bash
git add src/app/feeds/ src/hooks/useFeedHealth.ts src/components/feeds/
git commit -m "feat(dashboard): add feed health monitoring page at /feeds"
```

---

## Task 8: Vercel Cron — Background Feed Fetcher

**Files:**
- Create: `src/app/api/cron/fetch-feeds/route.ts`
- Modify: `vercel.json`

Vercel Cron triggers background feed fetching every 10 minutes. This fetches active feeds, persists events to Supabase, and updates feed health.

- [ ] **Step 1: Create the cron route handler**

```typescript
// src/app/api/cron/fetch-feeds/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { parseFeed } from "@/lib/api/rss-parser";
import { persistEvents } from "@/lib/db/events";
import { recordFeedSuccess, recordFeedError } from "@/lib/db/feed-health";
import type { IntelItem } from "@/types/intel";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s max for Vercel Cron

export async function GET(request: Request) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const startTime = Date.now();
  const stats = { fetched: 0, errors: 0, persisted: 0, totalFeeds: 0 };

  try {
    // Get active feeds, oldest-fetched first
    const { data: feeds } = await supabase
      .from("feeds")
      .select("id, url, name, category, default_severity")
      .eq("is_active", true)
      .lt("error_count", 5)
      .order("last_fetched_at", { ascending: true, nullsFirst: true })
      .limit(50); // Process 50 feeds per cron run

    if (!feeds?.length) {
      return NextResponse.json({ message: "No active feeds to process", stats });
    }

    stats.totalFeeds = feeds.length;
    const allItems: IntelItem[] = [];

    // Fetch in batches of 10 (concurrency control)
    const batchSize = 10;
    for (let i = 0; i < feeds.length; i += batchSize) {
      const batch = feeds.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (feed) => {
          try {
            const items = await parseFeed(feed.url, feed.category, feed.default_severity);
            await recordFeedSuccess(feed.url);
            stats.fetched++;
            return items;
          } catch {
            await recordFeedError(feed.url);
            stats.errors++;
            return [] as IntelItem[];
          }
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          allItems.push(...result.value);
        }
      }
    }

    // Persist all collected items
    if (allItems.length > 0) {
      const count = await persistEvents(allItems);
      stats.persisted = count;
    }

    return NextResponse.json({
      message: "Cron fetch complete",
      stats,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Cron fetch failed", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create the validation cron route**

```typescript
// src/app/api/cron/validate-feeds/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { checkFeed } from "@/lib/validators/feed-validator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const stats = { checked: 0, healthy: 0, broken: 0, deactivated: 0 };

  try {
    // Check feeds not validated in last 24 hours
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: feeds } = await supabase
      .from("feeds")
      .select("id, url, error_count, is_active")
      .eq("is_active", true)
      .or(`last_fetched_at.is.null,last_fetched_at.lt.${oneDayAgo}`)
      .limit(30);

    if (!feeds?.length) {
      return NextResponse.json({ message: "No feeds need validation", stats });
    }

    for (const feed of feeds) {
      const result = await checkFeed(feed.url);
      stats.checked++;

      if (result.isValid) {
        stats.healthy++;
      } else {
        stats.broken++;
        const newErrorCount = feed.error_count + 1;

        if (newErrorCount >= 5) {
          await supabase.from("feeds").update({ is_active: false, error_count: newErrorCount }).eq("id", feed.id);
          stats.deactivated++;
        } else {
          await supabase.from("feeds").update({ error_count: newErrorCount }).eq("id", feed.id);
        }
      }
    }

    return NextResponse.json({ message: "Feed validation complete", stats });
  } catch (error) {
    return NextResponse.json(
      { error: "Validation failed", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Update vercel.json with cron schedules**

Add to existing `vercel.json`:

```json
{
  "installCommand": "npm install",
  "crons": [
    {
      "path": "/api/cron/fetch-feeds",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/validate-feeds",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

- [ ] **Step 4: Test build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/ vercel.json
git commit -m "feat(cron): add Vercel Cron for background feed fetching (10min) and validation (6hr)"
```

---

## Task 9: Seed Expanded Feeds to Supabase

**Files:**
- Modify: `src/config/feeds.ts` (ensure count > 500)

After expanding the feeds config, seed the new feeds into Supabase.

- [ ] **Step 1: Run feed count test**

Run: `npx vitest run tests/unit/feeds-config.test.ts`
Expected: Total feeds > 500

- [ ] **Step 2: Seed to Supabase via API**

Use the existing `/api/feeds` POST endpoint to bulk-add new feeds:

```bash
# Script to seed new feeds (run locally)
node -e "
const feeds = require('./src/config/feeds.ts'); // Won't work directly — use the API approach below
"
```

Instead, create a one-time seed script via the Supabase MCP `execute_sql` tool:

```sql
INSERT INTO feeds (url, name, category, language, is_active, error_count)
VALUES
  -- Turkish feeds
  ('https://www.trthaber.com/xml_mobile.rss', 'TRT Haber', 'conflict', 'tr', true, 0),
  ('https://www.hurriyet.com.tr/rss/dunya', 'Hürriyet Dünya', 'conflict', 'tr', true, 0),
  -- ... (all new feeds)
ON CONFLICT (url) DO NOTHING;
```

- [ ] **Step 3: Verify feed count in Supabase**

Run: `SELECT category, COUNT(*) FROM feeds GROUP BY category ORDER BY count DESC;`
Expected: Total > 500 across 10 categories

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "feat(faz9): complete data expansion — 500+ feeds, 18 API clients, health dashboard, cron jobs"
```

---

## Task 10: Final Integration Test & Deploy

- [ ] **Step 1: Run all unit tests**

Run: `npx vitest run`
Expected: ALL PASS (78 existing + new tests)

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Deploy to Vercel**

Run: `npx vercel --prod` (or push to GitHub for auto-deploy)

- [ ] **Step 4: Verify feed health endpoint**

```bash
curl https://worldscope-two.vercel.app/api/feeds/health
```
Expected: `{ total: 500+, active: 400+ }`

- [ ] **Step 5: Verify /feeds dashboard page**

Visit: https://worldscope-two.vercel.app/feeds
Expected: Feed health monitoring dashboard with sortable table

- [ ] **Step 6: Push to GitHub**

```bash
git push origin master
```

---

## Summary

| Task | Description | New Files | Est. Time |
|------|-------------|-----------|-----------|
| 1 | ReliefWeb API client | 2 | 10 min |
| 2 | ACLED conflict data client | 1 | 10 min |
| 3 | 5 new API clients (Weather, Space, Forex, Aviation, NewsData) | 5 | 20 min |
| 4 | Expand RSS feeds to 500+ | 0 (modify) | 15 min |
| 5 | Feed validator with SSRF protection | 2 | 10 min |
| 6 | Wire new clients into intel aggregation | 0 (modify) | 5 min |
| 7 | Feed health monitoring dashboard | 6 | 25 min |
| 8 | Vercel Cron background jobs | 2 (modify 1) | 15 min |
| 9 | Seed expanded feeds to Supabase | 0 | 10 min |
| 10 | Integration test & deploy | 0 | 10 min |

**Total: 18 new files, ~130 min estimated**
