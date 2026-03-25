import { NextRequest, NextResponse } from "next/server";
import { sendTelegramLong } from "@/lib/api/telegram";
import { getGatewayHealth } from "@/lib/api/gateway";

export const runtime = "nodejs";
export const maxDuration = 120;

// ─── All API Sources ───────────────────────────────────────
const API_SOURCES: Array<{
  id: string;
  name: string;
  fetcher: () => Promise<unknown[]>;
}> = [];

// Lazy-load all sources to avoid import side effects at module level
async function loadApiSources() {
  const sources: typeof API_SOURCES = [
    // Tier 1 — Critical
    { id: "gdelt-articles", name: "GDELT Articles", fetcher: async () => (await import("@/lib/api/gdelt")).fetchGdeltArticles(undefined, 10, "en") },
    { id: "usgs-4.5w", name: "USGS Earthquakes 4.5", fetcher: async () => (await import("@/lib/api/usgs")).fetchEarthquakes("4.5_week") },
    { id: "oref", name: "OREF Israel Alerts", fetcher: async () => (await import("@/lib/api/tzevaadom")).fetchOrefAlerts(5) },
    { id: "gdacs", name: "GDACS Alerts", fetcher: async () => (await import("@/lib/api/gdacs")).fetchGDACSAlerts() },

    // Tier 2 — Secondary
    { id: "gdelt-geo", name: "GDELT Geo Events", fetcher: async () => (await import("@/lib/api/gdelt")).fetchGdeltGeo(undefined, 20, "en") },
    { id: "reliefweb", name: "ReliefWeb", fetcher: async () => (await import("@/lib/api/reliefweb")).fetchReliefWebDisasters() },
    { id: "spaceflight", name: "Spaceflight News", fetcher: async () => (await import("@/lib/api/spaceflight")).fetchSpaceflightNews() },
    { id: "disease-sh", name: "Disease.sh", fetcher: async () => (await import("@/lib/api/disease-sh")).fetchDiseaseOutbreaks() },
    { id: "cyber", name: "Cyber Threats", fetcher: async () => (await import("@/lib/api/cyber-threats")).fetchAllCyberThreats() },
    { id: "nasa-firms", name: "NASA FIRMS Fire", fetcher: async () => (await import("@/lib/api/nasa-firms")).fetchFireHotspots(10) },
    { id: "nasa-eonet", name: "NASA EONET", fetcher: async () => (await import("@/lib/api/nasa-eonet")).fetchNasaEonet(7, 10) },
    { id: "hackernews", name: "Hacker News", fetcher: async () => (await import("@/lib/api/hackernews")).fetchHackerNews(5) },
    { id: "who", name: "WHO Outbreaks", fetcher: async () => (await import("@/lib/api/who-outbreaks")).fetchWhoOutbreaks(5) },
    { id: "safecast", name: "Safecast Radiation", fetcher: async () => { const m = await import("@/lib/api/radiation"); return m.radiationToIntelItems(await m.fetchSafecastReadings()); } },
    { id: "ucdp", name: "UCDP Conflict", fetcher: async () => (await import("@/lib/api/ucdp")).fetchUcdpEvents(10) },
    { id: "cloudflare-radar", name: "Cloudflare Radar", fetcher: async () => (await import("@/lib/api/cloudflare-radar")).fetchInternetOutagesAsIntel() },
    { id: "kandilli", name: "Kandilli Earthquakes", fetcher: async () => (await import("@/lib/api/kandilli")).fetchKandilliEarthquakes() },
    { id: "entsoe", name: "ENTSO-E Energy", fetcher: async () => (await import("@/lib/api/entsoe")).fetchEntsoeIntel() },
    { id: "eia", name: "EIA US Energy", fetcher: async () => (await import("@/lib/api/eia")).fetchEiaIntel() },
    { id: "espn-sports", name: "ESPN Sports", fetcher: async () => (await import("@/lib/api/espn-sports")).fetchAllSportsScores() },
    { id: "supply-chain", name: "Supply Chain Attacks", fetcher: async () => (await import("@/lib/api/supply-chain-threats")).fetchSupplyChainAttacks() },
    { id: "dollar-toman", name: "Dollar/Toman", fetcher: async () => (await import("@/lib/api/dollar-toman")).fetchDollarTomanIntel() },
    { id: "crisis-news", name: "Crisis News", fetcher: async () => (await import("@/lib/api/crisis-news")).fetchCrisisReports() },
    { id: "crypto-news", name: "CoinGecko News", fetcher: async () => (await import("@/lib/api/crypto-news")).fetchCoinGeckoNews() },
    { id: "cryptopanic", name: "CryptoPanic", fetcher: async () => (await import("@/lib/api/crypto-news")).fetchCryptoPanicNews() },
    { id: "crypto-convert", name: "Crypto Convert", fetcher: async () => (await import("@/lib/api/crypto-convert")).fetchCryptoConvertIntel() },
    { id: "electricity-maps", name: "Electricity Maps", fetcher: async () => (await import("@/lib/api/electricity-maps")).fetchElectricityMapsIntel() },
    { id: "ransomware-live", name: "Ransomware Live", fetcher: async () => (await import("@/lib/api/ransomware-live")).fetchRansomwareVictims() },
    { id: "sar-interference", name: "SAR Interference", fetcher: async () => (await import("@/lib/api/sar-interference")).fetchSarInterference() },
    { id: "football-data", name: "Football Data", fetcher: async () => (await import("@/lib/api/football-data")).fetchFootballIntel() },
    { id: "tv-screener", name: "TV Screener", fetcher: async () => (await import("@/lib/api/tv-screener")).fetchMarketMoversIntel() },
    { id: "market-indices", name: "Market Indices", fetcher: async () => (await import("@/lib/api/finance-mcp")).fetchMajorIndices() },
    { id: "spacex", name: "SpaceX Launches", fetcher: async () => (await import("@/lib/api/spacex")).fetchSpaceXLaunches() },
    { id: "launch-library", name: "Launch Library", fetcher: async () => (await import("@/lib/api/spacex")).fetchLaunchLibrary() },
    { id: "nvd-cve", name: "NVD CVE", fetcher: async () => (await import("@/lib/api/nvd-cve")).fetchNvdCves(5) },
    { id: "f1", name: "F1 Ergast", fetcher: async () => (await import("@/lib/api/f1-ergast")).fetchF1Intel() },
    { id: "openf1", name: "OpenF1", fetcher: async () => (await import("@/lib/api/openf1")).fetchOpenF1Intel() },
    { id: "nba-stats", name: "NBA Stats", fetcher: async () => (await import("@/lib/api/nba-stats")).fetchNbaIntel() },
    { id: "transfermarkt", name: "Transfermarkt", fetcher: async () => (await import("@/lib/api/transfermarkt")).fetchTransfermarktIntel() },
    { id: "cricket", name: "Cricket", fetcher: async () => (await import("@/lib/api/cricket")).fetchCricketIntel() },
    { id: "good-news", name: "Good News", fetcher: async () => (await import("@/lib/api/good-news")).fetchGoodNews() },
  ];
  return sources;
}

// ─── Priority RSS Feeds ─────────────────────────────────────
const PRIORITY_FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC World" },
  { url: "http://rss.cnn.com/rss/edition_world.rss", name: "CNN World" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", name: "Al Jazeera" },
  { url: "https://www.theguardian.com/world/rss", name: "The Guardian" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", name: "NYT World" },
  { url: "https://rss.dw.com/xml/rss-en-all", name: "DW News" },
  { url: "https://www.france24.com/en/rss", name: "France24" },
  { url: "https://feeds.npr.org/1004/rss.xml", name: "NPR World" },
  { url: "https://feeds.skynews.com/feeds/rss/world.xml", name: "Sky News" },
  { url: "https://www.aa.com.tr/en/rss/default?cat=world", name: "Anadolu Agency" },
  { url: "https://www.theverge.com/rss/index.xml", name: "The Verge" },
  { url: "https://techcrunch.com/feed/", name: "TechCrunch" },
  { url: "https://feeds.arstechnica.com/arstechnica/index", name: "Ars Technica" },
  { url: "https://www.wired.com/feed/rss", name: "Wired" },
  { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", name: "WSJ Markets" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", name: "CNBC World" },
  { url: "https://feeds.bloomberg.com/markets/news.rss", name: "Bloomberg" },
  { url: "https://www.bleepingcomputer.com/feed/", name: "BleepingComputer" },
  { url: "https://hnrss.org/frontpage", name: "Hacker News RSS" },
  { url: "https://www.darkreading.com/rss.xml", name: "Dark Reading" },
  { url: "https://www.who.int/feeds/entity/csr/don/en/rss.xml", name: "WHO Disease Alerts" },
  { url: "https://www.sciencedaily.com/rss/top.xml", name: "ScienceDaily" },
  { url: "https://www.middleeasteye.net/rss", name: "Middle East Eye" },
  { url: "https://www.rt.com/rss/news/", name: "RT News" },
  { url: "https://www.euronews.com/rss", name: "Euronews" },
  { url: "https://www3.nhk.or.jp/rss/news/cat0.xml", name: "NHK World" },
  { url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml", name: "CNA" },
];

// ─── Types ──────────────────────────────────────────────────
interface SourceResult {
  id: string;
  name: string;
  type: "api" | "rss";
  status: "ok" | "error" | "empty" | "timeout";
  items: number;
  durationMs: number;
  error?: string;
  sampleTitles?: string[]; // First 3 headlines from this source
}

// ─── Test a single source ───────────────────────────────────
async function testSource(
  id: string,
  name: string,
  type: "api" | "rss",
  fetcher: () => Promise<unknown[]>,
  timeoutMs = 15_000
): Promise<SourceResult> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fetcher(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs)
      ),
    ]);
    const arr = Array.isArray(result) ? result : [];
    const items = arr.length;

    // Extract sample titles for the detailed report
    const sampleTitles = arr
      .slice(0, 3)
      .map((item) => {
        const obj = item as Record<string, unknown>;
        const title = (obj.title as string) || (obj.summary as string) || "";
        return title.slice(0, 80);
      })
      .filter(Boolean);

    return {
      id, name, type,
      status: items > 0 ? "ok" : "empty",
      items,
      durationMs: Date.now() - start,
      sampleTitles,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      id, name, type,
      status: msg === "TIMEOUT" ? "timeout" : "error",
      items: 0,
      durationMs: Date.now() - start,
      error: msg.slice(0, 100),
    };
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Build Telegram report ──────────────────────────────────
function buildReport(results: SourceResult[], totalDurationMs: number, detailed = false): string {
  const apiResults = results.filter((r) => r.type === "api");
  const rssResults = results.filter((r) => r.type === "rss");

  const apiOk = apiResults.filter((r) => r.status === "ok").length;
  const rssOk = rssResults.filter((r) => r.status === "ok").length;
  const totalItems = results.reduce((sum, r) => sum + r.items, 0);
  const totalOk = results.filter((r) => r.status === "ok").length;
  const successRate = Math.round((totalOk / results.length) * 100);

  const icon = (r: SourceResult) => {
    switch (r.status) {
      case "ok": return "\u2705";      // green check
      case "empty": return "\u26a1";    // lightning (no data but no error)
      case "timeout": return "\u23f0";  // clock
      case "error": return "\u274c";    // red X
    }
  };

  const formatLine = (r: SourceResult) => {
    const dur = r.durationMs < 1000
      ? `${r.durationMs}ms`
      : `${(r.durationMs / 1000).toFixed(1)}s`;

    let line = "";
    if (r.status === "ok") line = `${icon(r)} ${r.name}: <b>${r.items}</b> items (${dur})`;
    else if (r.status === "empty") line = `${icon(r)} ${r.name}: 0 items (${dur})`;
    else if (r.status === "timeout") line = `${icon(r)} ${r.name}: TIMEOUT (${dur})`;
    else line = `${icon(r)} ${r.name}: ${r.error || "ERROR"} (${dur})`;

    // In detailed mode, show sample headlines
    if (detailed && r.sampleTitles && r.sampleTitles.length > 0) {
      for (const t of r.sampleTitles) {
        line += `\n   \u2514 <i>${escapeHtml(t)}</i>`;
      }
    }
    return line;
  };

  // Gateway circuit breaker status
  const gw = getGatewayHealth();
  const openCircuits = gw.filter((g) => g.isOpen);

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  let report = `<b>\ud83d\udcca WORLDSCOPE SOURCE HEALTH</b>\n`;
  report += `\ud83d\udd50 ${now} UTC\n\n`;

  // API Sources
  report += `<b>\ud83d\udd0c API SOURCES (${apiOk}/${apiResults.length} active)</b>\n`;
  for (const r of apiResults) {
    report += `${formatLine(r)}\n`;
  }

  report += `\n<b>\ud83d\udce1 RSS FEEDS (${rssOk}/${rssResults.length} active)</b>\n`;
  for (const r of rssResults) {
    report += `${formatLine(r)}\n`;
  }

  // Circuit breaker warnings
  if (openCircuits.length > 0) {
    report += `\n<b>\u26a0\ufe0f CIRCUIT BREAKERS OPEN</b>\n`;
    for (const c of openCircuits) {
      report += `\ud83d\udd34 ${c.sourceId}: ${c.failures} failures\n`;
    }
  }

  // Summary
  const dur = totalDurationMs < 1000
    ? `${totalDurationMs}ms`
    : `${(totalDurationMs / 1000).toFixed(1)}s`;

  report += `\n<b>\ud83d\udcc8 SUMMARY</b>\n`;
  report += `Total items: <b>${totalItems}</b>\n`;
  report += `Success rate: <b>${successRate}%</b> (${totalOk}/${results.length})\n`;
  report += `Errors: ${results.filter((r) => r.status === "error").length} | `;
  report += `Timeouts: ${results.filter((r) => r.status === "timeout").length} | `;
  report += `Empty: ${results.filter((r) => r.status === "empty").length}\n`;
  report += `Duration: <b>${dur}</b>`;

  return report;
}

// ─── Main handler ───────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.ADMIN_KEY;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  if (adminKey && request.nextUrl.searchParams.get("key") === adminKey) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const notify = request.nextUrl.searchParams.get("notify") !== "false";
  const detailed = request.nextUrl.searchParams.get("detail") === "true";

  // Load sources dynamically
  const apiSources = await loadApiSources();

  // Test all API sources in parallel (batches of 8 to avoid connection pool exhaustion)
  const allResults: SourceResult[] = [];

  // Batch API sources
  for (let i = 0; i < apiSources.length; i += 8) {
    const batch = apiSources.slice(i, i + 8);
    const batchResults = await Promise.all(
      batch.map((s) => testSource(s.id, s.name, "api", s.fetcher))
    );
    allResults.push(...batchResults);
    // Small pause between batches to let connections close
    await new Promise((r) => setTimeout(r, 500));
  }

  // Test RSS feeds (batch of 5 — smaller because RSS parser opens its own connections)
  const { fetchFeed } = await import("@/lib/api/rss-parser");
  for (let i = 0; i < PRIORITY_FEEDS.length; i += 5) {
    const batch = PRIORITY_FEEDS.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map((f) =>
        testSource(
          `rss-${f.name.toLowerCase().replace(/\s+/g, "-")}`,
          f.name,
          "rss",
          () => fetchFeed(f.url, f.name)
        )
      )
    );
    allResults.push(...batchResults);
    // Pause between RSS batches
    await new Promise((r) => setTimeout(r, 500));
  }

  const totalDuration = Date.now() - startTime;

  // Build report
  const report = buildReport(allResults, totalDuration, detailed);

  // Send to Telegram
  let telegramSent = false;
  if (notify) {
    telegramSent = await sendTelegramLong(report);
  }

  return NextResponse.json({
    success: true,
    telegramSent,
    totalSources: allResults.length,
    active: allResults.filter((r) => r.status === "ok").length,
    empty: allResults.filter((r) => r.status === "empty").length,
    errors: allResults.filter((r) => r.status === "error").length,
    timeouts: allResults.filter((r) => r.status === "timeout").length,
    totalItems: allResults.reduce((s, r) => s + r.items, 0),
    durationMs: totalDuration,
    results: allResults,
  });
}
