import type { Category, Severity } from "@/types/intel";

export interface FeedConfig {
  name: string;
  url: string;
  category: Category;
  defaultSeverity: Severity;
  region?: string;
}

export const MVP_FEEDS: FeedConfig[] = [
  // ── Conflict & Security ───────────────────────────────────────────
  {
    name: "Reuters World",
    url: "https://feeds.reuters.com/Reuters/worldNews",
    category: "conflict",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "BBC World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "conflict",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "conflict",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "AP News",
    url: "https://rsshub.app/apnews/topics/world-news",
    category: "conflict",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "Defense One",
    url: "https://www.defenseone.com/rss/",
    category: "conflict",
    defaultSeverity: "high",
    region: "global",
  },
  {
    name: "War on the Rocks",
    url: "https://warontherocks.com/feed/",
    category: "conflict",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "Janes Defence",
    url: "https://www.janes.com/feeds/news",
    category: "conflict",
    defaultSeverity: "high",
    region: "global",
  },
  {
    name: "Liveuamap",
    url: "https://liveuamap.com/rss",
    category: "conflict",
    defaultSeverity: "high",
    region: "europe",
  },

  // ── Finance & Economy ─────────────────────────────────────────────
  {
    name: "Reuters Business",
    url: "https://feeds.reuters.com/reuters/businessNews",
    category: "finance",
    defaultSeverity: "low",
    region: "global",
  },
  {
    name: "CNBC Top News",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    category: "finance",
    defaultSeverity: "low",
    region: "us",
  },
  {
    name: "Bloomberg Markets",
    url: "https://feeds.bloomberg.com/markets/news.rss",
    category: "finance",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "Financial Times",
    url: "https://www.ft.com/rss/home",
    category: "finance",
    defaultSeverity: "low",
    region: "global",
  },
  {
    name: "MarketWatch",
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    category: "finance",
    defaultSeverity: "low",
    region: "us",
  },
  {
    name: "Investing.com",
    url: "https://www.investing.com/rss/news.rss",
    category: "finance",
    defaultSeverity: "low",
    region: "global",
  },

  // ── Cyber Security ────────────────────────────────────────────────
  {
    name: "Krebs on Security",
    url: "https://krebsonsecurity.com/feed/",
    category: "cyber",
    defaultSeverity: "high",
    region: "global",
  },
  {
    name: "The Hacker News",
    url: "https://feeds.feedburner.com/TheHackersNews",
    category: "cyber",
    defaultSeverity: "high",
    region: "global",
  },
  {
    name: "BleepingComputer",
    url: "https://www.bleepingcomputer.com/feed/",
    category: "cyber",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "Dark Reading",
    url: "https://www.darkreading.com/rss.xml",
    category: "cyber",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "Threatpost",
    url: "https://threatpost.com/feed/",
    category: "cyber",
    defaultSeverity: "high",
    region: "global",
  },
  {
    name: "US-CERT Alerts",
    url: "https://www.cisa.gov/uscert/ncas/alerts.xml",
    category: "cyber",
    defaultSeverity: "critical",
    region: "us",
  },

  // ── Technology ────────────────────────────────────────────────────
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "tech",
    defaultSeverity: "info",
    region: "global",
  },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    category: "tech",
    defaultSeverity: "info",
    region: "global",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    category: "tech",
    defaultSeverity: "info",
    region: "global",
  },
  {
    name: "Wired",
    url: "https://www.wired.com/feed/rss",
    category: "tech",
    defaultSeverity: "info",
    region: "global",
  },
  {
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/",
    category: "tech",
    defaultSeverity: "info",
    region: "global",
  },
  {
    name: "Hacker News",
    url: "https://hnrss.org/frontpage",
    category: "tech",
    defaultSeverity: "info",
    region: "global",
  },

  // ── Natural Disasters & Environment ───────────────────────────────
  {
    name: "USGS Earthquakes",
    url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.atom",
    category: "natural",
    defaultSeverity: "high",
    region: "global",
  },
  {
    name: "GDACS",
    url: "https://www.gdacs.org/xml/rss.xml",
    category: "natural",
    defaultSeverity: "high",
    region: "global",
  },
  {
    name: "ReliefWeb Updates",
    url: "https://reliefweb.int/updates/rss.xml",
    category: "natural",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "NOAA Weather Alerts",
    url: "https://alerts.weather.gov/cap/us.php?x=1",
    category: "natural",
    defaultSeverity: "medium",
    region: "us",
  },
  {
    name: "Volcano Discovery",
    url: "https://www.volcanodiscovery.com/rss/news.xml",
    category: "natural",
    defaultSeverity: "medium",
    region: "global",
  },

  // ── Aviation ──────────────────────────────────────────────────────
  {
    name: "Aviation Herald",
    url: "https://avherald.com/h?list=0&feed=1",
    category: "aviation",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "FlightGlobal",
    url: "https://www.flightglobal.com/rss",
    category: "aviation",
    defaultSeverity: "low",
    region: "global",
  },
  {
    name: "Simple Flying",
    url: "https://simpleflying.com/feed/",
    category: "aviation",
    defaultSeverity: "info",
    region: "global",
  },

  // ── Energy ────────────────────────────────────────────────────────
  {
    name: "OilPrice.com",
    url: "https://oilprice.com/rss/main",
    category: "energy",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "Energy Intelligence",
    url: "https://www.energyintel.com/rss",
    category: "energy",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "Rigzone",
    url: "https://www.rigzone.com/news/rss/rigzone_latest.aspx",
    category: "energy",
    defaultSeverity: "low",
    region: "global",
  },

  // ── Diplomacy & Politics ──────────────────────────────────────────
  {
    name: "Foreign Affairs",
    url: "https://www.foreignaffairs.com/rss.xml",
    category: "diplomacy",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "The Diplomat",
    url: "https://thediplomat.com/feed/",
    category: "diplomacy",
    defaultSeverity: "low",
    region: "asia",
  },
  {
    name: "European Council",
    url: "https://www.consilium.europa.eu/en/rss/",
    category: "diplomacy",
    defaultSeverity: "low",
    region: "europe",
  },
  {
    name: "UN News",
    url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
    category: "diplomacy",
    defaultSeverity: "medium",
    region: "global",
  },

  // ── Protest & Civil Unrest ────────────────────────────────────────
  {
    name: "ACLED",
    url: "https://acleddata.com/feed/",
    category: "protest",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "Crisis Group",
    url: "https://www.crisisgroup.org/feed",
    category: "protest",
    defaultSeverity: "high",
    region: "global",
  },

  // ── Health & Pandemic ─────────────────────────────────────────────
  {
    name: "WHO News",
    url: "https://www.who.int/rss-feeds/news-english.xml",
    category: "health",
    defaultSeverity: "medium",
    region: "global",
  },
  {
    name: "CDC Newsroom",
    url: "https://tools.cdc.gov/podcasts/feed.asp?feedid=183",
    category: "health",
    defaultSeverity: "medium",
    region: "us",
  },
  {
    name: "ProMED",
    url: "https://promedmail.org/feed/",
    category: "health",
    defaultSeverity: "high",
    region: "global",
  },
  {
    name: "ECDC News",
    url: "https://www.ecdc.europa.eu/en/rss.xml",
    category: "health",
    defaultSeverity: "medium",
    region: "europe",
  },

  // ── Turkey / Regional ─────────────────────────────────────────────
  {
    name: "Daily Sabah",
    url: "https://www.dailysabah.com/rssFeed/home",
    category: "diplomacy",
    defaultSeverity: "low",
    region: "turkey",
  },
  {
    name: "Anadolu Agency EN",
    url: "https://www.aa.com.tr/en/rss/default?cat=world",
    category: "conflict",
    defaultSeverity: "medium",
    region: "turkey",
  },
];

export const FEED_COUNT = MVP_FEEDS.length;
