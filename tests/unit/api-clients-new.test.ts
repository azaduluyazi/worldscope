import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the redis cache layer — bypass caching and call fetcher directly
vi.mock("@/lib/cache/redis", () => ({
  cachedFetch: async <T>(_key: string, fetcher: () => Promise<T>) => fetcher(),
  TTL: { MARKET: 60, NEWS: 600, RSS: 900, THREAT: 300, AI_BRIEF: 3600 },
}));

// ─── ReliefWeb ──────────────────────────────────────────────────

describe("ReliefWeb API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
            primary_country: {
              iso3: "TUR",
              name: "Turkiye",
              location: { lat: 39.0, lon: 35.0 },
            },
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
      id: "reliefweb-12345",
      title: "Earthquake in Turkey",
      source: "OCHA",
      category: "natural",
      severity: "high",
      lat: 39.0,
      lng: 35.0,
    });
  });

  it("should return [] on fetch error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const { fetchReliefWebDisasters } = await import("@/lib/api/reliefweb");
    const items = await fetchReliefWebDisasters();
    expect(items).toEqual([]);
  });
});

// ─── ACLED ──────────────────────────────────────────────────────

describe("ACLED API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("ACLED_API_KEY", "test-key");
    vi.stubEnv("ACLED_EMAIL", "test@example.com");
  });

  it("should export fetchAcledEvents function", async () => {
    const { fetchAcledEvents } = await import("@/lib/api/acled");
    expect(typeof fetchAcledEvents).toBe("function");
  });

  it("should return [] when API key is missing", async () => {
    vi.stubEnv("ACLED_API_KEY", "");
    vi.stubEnv("ACLED_EMAIL", "");

    const { fetchAcledEvents } = await import("@/lib/api/acled");
    const items = await fetchAcledEvents();
    expect(items).toEqual([]);
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
    expect(items[0].severity).toBe("high");
  });

  it("should escalate severity for high fatality events", async () => {
    const mockResponse = {
      data: [
        {
          event_id_cnty: "SYR99999",
          event_date: "2026-03-17",
          event_type: "Protests",
          sub_event_type: "Peaceful protest",
          actor1: "Civilians",
          country: "Syria",
          latitude: "33.5",
          longitude: "36.3",
          notes: "Mass casualty event during protest",
          fatalities: "55",
          source: "Reuters",
          iso: 760,
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchAcledEvents } = await import("@/lib/api/acled");
    const items = await fetchAcledEvents();
    expect(items[0].severity).toBe("critical");
  });
});

// ─── OpenWeatherMap ─────────────────────────────────────────────

describe("OpenWeatherMap Alerts Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should export fetchWeatherAlerts function", async () => {
    const { fetchWeatherAlerts } = await import("@/lib/api/openweathermap");
    expect(typeof fetchWeatherAlerts).toBe("function");
  });

  it("should return [] when API key is missing", async () => {
    vi.stubEnv("OPENWEATHERMAP_API_KEY", "");

    const { fetchWeatherAlerts } = await import("@/lib/api/openweathermap");
    const items = await fetchWeatherAlerts();
    expect(items).toEqual([]);
  });
});

// ─── Spaceflight News ───────────────────────────────────────────

describe("Spaceflight News Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(items.length).toBe(1);
    expect(items[0].category).toBe("tech");
    expect(items[0].source).toBe("SpaceNews");
    expect(items[0].severity).toBe("info");
  });

  it("should return [] on API failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    const { fetchSpaceflightNews } = await import("@/lib/api/spaceflight");
    const items = await fetchSpaceflightNews();
    expect(items).toEqual([]);
  });
});

// ─── ExchangeRate ───────────────────────────────────────────────

describe("ExchangeRate Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should export fetchExchangeRates function", async () => {
    const { fetchExchangeRates } = await import("@/lib/api/exchangerate");
    expect(typeof fetchExchangeRates).toBe("function");
  });

  it("should return MarketQuote array with tracked pairs", async () => {
    const mockResponse = {
      rates: { EUR: 0.92, GBP: 0.79, JPY: 149.5, TRY: 38.2, CNY: 7.24 },
      date: "2026-03-18",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchExchangeRates } = await import("@/lib/api/exchangerate");
    const quotes = await fetchExchangeRates();
    expect(quotes.length).toBe(5);
    expect(quotes[0].symbol).toBe("USD/EUR");
    expect(quotes[0].price).toBe(0.92);
    expect(quotes[0].updatedAt).toBeDefined();
  });
});

// ─── FlightRadar (Aviation Safety Network) ──────────────────────

describe("FlightRadar Incidents Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should export fetchAviationIncidents function", async () => {
    const { fetchAviationIncidents } = await import("@/lib/api/flightradar");
    expect(typeof fetchAviationIncidents).toBe("function");
  });

  it("should parse RSS XML and return IntelItem array", async () => {
    const mockXml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Boeing 737 emergency landing in Dallas</title>
      <link>https://aviation-safety.net/report/12345</link>
      <description>Emergency landing due to engine failure</description>
      <pubDate>Mon, 18 Mar 2026 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Fatal crash of Cessna near Denver</title>
      <link>https://aviation-safety.net/report/12346</link>
      <description>Two killed in fatal crash</description>
      <pubDate>Mon, 17 Mar 2026 08:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockXml),
    });

    const { fetchAviationIncidents } = await import("@/lib/api/flightradar");
    const items = await fetchAviationIncidents();
    expect(items.length).toBe(2);
    expect(items[0].category).toBe("aviation");
    expect(items[0].severity).toBe("high"); // "emergency" keyword
    expect(items[1].severity).toBe("critical"); // "fatal" keyword
    expect(items[0].source).toBe("Aviation Safety Network");
  });

  it("should return [] on fetch error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("timeout"));

    const { fetchAviationIncidents } = await import("@/lib/api/flightradar");
    const items = await fetchAviationIncidents();
    expect(items).toEqual([]);
  });
});

// ─── NewsData.io ────────────────────────────────────────────────

describe("NewsData Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should export fetchNewsData function", async () => {
    const { fetchNewsData } = await import("@/lib/api/newsdata");
    expect(typeof fetchNewsData).toBe("function");
  });

  it("should return [] when API key is missing", async () => {
    vi.stubEnv("NEWSDATA_API_KEY", "");

    const { fetchNewsData } = await import("@/lib/api/newsdata");
    const items = await fetchNewsData();
    expect(items).toEqual([]);
  });

  it("should map categories and sentiment to severity", async () => {
    vi.stubEnv("NEWSDATA_API_KEY", "test-key");

    const mockResponse = {
      results: [
        {
          article_id: "abc123",
          title: "Tech Giant Announces Layoffs",
          description: "Major tech company lays off 10,000 workers",
          link: "https://example.com/article/1",
          source_id: "techcrunch",
          pubDate: "2026-03-18 10:00:00",
          country: ["us"],
          category: ["technology"],
          sentiment: "negative",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchNewsData } = await import("@/lib/api/newsdata");
    const items = await fetchNewsData();
    expect(items.length).toBe(1);
    expect(items[0].category).toBe("tech");
    expect(items[0].severity).toBe("high"); // negative sentiment
    expect(items[0].source).toBe("techcrunch");
  });
});
