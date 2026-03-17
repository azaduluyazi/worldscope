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

// ─── Severity Classification ───
// Two-pass system: first check for DOWNGRADE signals (press releases, reports, training),
// then match threat patterns. This prevents OPCW announcements or academic papers
// from being classified as CRITICAL.

const DOWNGRADE_PATTERNS = [
  /\bcommemorat/i,
  /\bcontribut(?:es|ed|ion)/i,
  /\btraining\s+(?:series|course|program|exercise)/i,
  /\breport\s+on\b/i,
  /\breleases?\s+(?:landmark|new|annual)\s+report/i,
  /\bannual\s+(?:meeting|report|session)/i,
  /\bclosing\s+remarks/i,
  /\bopening\s+(?:remarks|statement)/i,
  /\bpress\s+(?:release|statement|conference)/i,
  /\bprovides?\s+€/i,
  /\bcontributes?\s+(?:nearly|over|more\s+than)?\s*€/i,
  /\bstrengthen(?:s|ing)?\s+(?:OPCW|activities)/i,
  /\bhelp\s+bridge/i,
  /\byoung\s+professionals/i,
  /\bskills?\s+gap/i,
];

const CRITICAL_PATTERNS = [
  /\bbreaking\s*(?:news|:)/i,
  /\bnuclear\s+(?:strike|attack|warhead|detonation|bomb)\b/i,
  /\bmissile\s+(?:launch|strike|attack|fired)\b/i,
  /\btsunami\s+warning/i,
  /\bmass\s+casualt/i,
  /\bterror(?:ist)?\s+attack/i,
  /\bchemical\s+attack\b/i,
  /\bbioweapon/i,
  /\bmajor\s+earthquake/i,
  /\bwar\s+(?:declared|begins|erupts|breaks\s+out)/i,
];

const HIGH_PATTERNS = [
  /\bexplosion\b/i,
  /\bescalat(?:ion|es|ed|ing)\b/i,
  /\bemergency\s+(?:declared|alert|response)/i,
  /\bbombing\b/i,
  /\bshelling\b/i,
  /\bcyberattack\b/i,
  /\bransomware\b/i,
  /\bcoup\b/i,
  /\bassassinat/i,
  /\bevacuat/i,
  /\bcasualt(?:y|ies)\b/i,
  /\binvasion\b/i,
  /\bnuclear\s+(?:test|launch|threat)\b/i,
  /\bchemical\s+weapon/i,
  /\burgent\b/i,
];

const MEDIUM_PATTERNS = [
  /\bbreach(?:ed|es|ing)?\b/i,
  /\bsanctions?\b/i,
  /\bcrash(?:ed|es|ing)?\b/i,
  /\bcritical\s+(?:infrastructure|vulnerability|threat|alert)/i,
  /\bvulnerability\b/i,
  /\bmalware\b/i,
  /\bprotest(?:s|ers)?\b/i,
  /\bunrest\b/i,
  /\bdeploy(?:ed|s|ment)\b/i,
  /\bconflict\b/i,
  /\bcrisis\b/i,
  /\bthreat\b/i,
  /\bwarning\b/i,
];

// Pre-compile keyword regexes at module load to avoid per-call RegExp construction (ReDoS safety)
const COMPILED_CATEGORY_MATCHERS = Object.entries(CATEGORY_KEYWORDS).map(([cat, keywords]) => ({
  category: cat as Category,
  matchers: keywords.map((kw) =>
    kw.includes(" ")
      ? { type: "includes" as const, kw }
      : { type: "regex" as const, re: new RegExp(`\\b${kw}\\b`) }
  ),
}));

export function categorizeFeedItem(text: string): Category {
  const lower = text.toLowerCase();
  for (const { category, matchers } of COMPILED_CATEGORY_MATCHERS) {
    if (matchers.some((m) =>
      m.type === "includes" ? lower.includes(m.kw) : m.re.test(lower)
    )) {
      return category;
    }
  }
  return "diplomacy";
}

export function mapSeverity(text: string): Severity {
  // If the text is clearly a press release / report / training, cap severity at medium
  const isInformational = DOWNGRADE_PATTERNS.some((re) => re.test(text));

  if (!isInformational && CRITICAL_PATTERNS.some((re) => re.test(text))) return "critical";
  if (!isInformational && HIGH_PATTERNS.some((re) => re.test(text))) return "high";
  if (MEDIUM_PATTERNS.some((re) => re.test(text))) return "medium";
  return "low";
}

/** Block SSRF: reject private/internal IP ranges and non-http(s) schemes */
function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname;
    // Block private IPs, localhost, link-local, cloud metadata
    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      host === "[::1]" ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith(".internal") ||
      host.endsWith(".local")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchFeed(url: string, feedName: string): Promise<IntelItem[]> {
  try {
    if (!isUrlSafe(url)) return [];
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 10).map((item, idx) => {
      const title = item.title || "Untitled";
      const raw = item.link || item.guid || `${feedName}-${idx}-${title}`;
      return {
        id: `rss-${Buffer.from(raw).toString("base64url").slice(0, 40)}-${idx}`,
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
