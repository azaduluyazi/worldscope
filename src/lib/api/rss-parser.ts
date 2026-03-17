import Parser from "rss-parser";
import type { IntelItem, Category, Severity } from "@/types/intel";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "WorldScope/1.0" },
});

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  conflict: ["war", "military", "missile", "strike", "attack", "troops", "nato", "defense", "combat", "weapon", "bomb", "artillery", "invasion"],
  finance: ["market", "stock", "economy", "fed", "inflation", "gdp", "trade", "bank", "currency", "recession", "s&p", "dow", "nasdaq", "bitcoin", "crypto"],
  cyber: ["cyber", "hack", "breach", "ransomware", "malware", "vulnerability", "cve", "phishing", "ddos"],
  tech: ["ai", "artificial intelligence", "startup", "silicon valley", "openai", "google", "apple", "nvidia", "chip", "semiconductor", "software", "cloud"],
  natural: ["earthquake", "tsunami", "hurricane", "flood", "wildfire", "volcano", "storm", "disaster", "climate"],
  aviation: ["flight", "airline", "aircraft", "airport", "aviation", "faa", "crash", "boeing", "airbus"],
  energy: ["oil", "gas", "opec", "energy", "nuclear", "solar", "wind", "pipeline", "electricity"],
  diplomacy: ["diplomat", "embassy", "summit", "treaty", "sanction", "un", "united nations", "foreign minister"],
  protest: ["protest", "demonstration", "riot", "unrest", "strike", "opposition", "rally"],
  health: ["pandemic", "outbreak", "who", "vaccine", "epidemic", "virus", "disease"],
};

const CRITICAL_KEYWORDS = ["breaking", "urgent", "nuclear", "missile launch", "invasion", "tsunami warning", "mass casualty"];
const HIGH_KEYWORDS = ["crash", "surge", "alert", "emergency", "explosion", "escalation", "critical"];

export function categorizeFeedItem(text: string): Category {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category as Category;
    }
  }
  return "diplomacy";
}

export function mapSeverity(text: string): Severity {
  const lower = text.toLowerCase();
  if (CRITICAL_KEYWORDS.some((kw) => lower.includes(kw))) return "critical";
  if (HIGH_KEYWORDS.some((kw) => lower.includes(kw))) return "high";
  return "medium";
}

export async function fetchFeed(url: string, feedName: string): Promise<IntelItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 10).map((item) => {
      const title = item.title || "Untitled";
      return {
        id: `rss-${Buffer.from(item.link || item.guid || title).toString("base64url").slice(0, 32)}`,
        title,
        summary: item.contentSnippet?.slice(0, 300) || "",
        url: item.link || "",
        source: feedName,
        category: categorizeFeedItem(title + " " + (item.contentSnippet || "")),
        severity: mapSeverity(title + " " + (item.contentSnippet || "")),
        publishedAt: item.isoDate || new Date().toISOString(),
        imageUrl: item.enclosure?.url,
      };
    });
  } catch {
    return [];
  }
}
