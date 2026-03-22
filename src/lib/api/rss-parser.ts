import Parser from "rss-parser";
import type { IntelItem, Category, Severity } from "@/types/intel";

/* ── Bot Protection Bypass: Rotate User-Agents to avoid detection ── */
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
];

let uaIndex = 0;
function getNextUserAgent(): string {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua;
}

function createParser(): Parser {
  return new Parser({
    timeout: 15000,
    headers: {
      "User-Agent": getNextUserAgent(),
      "Accept": "application/rss+xml, application/xml, application/atom+xml, text/xml, */*;q=0.1",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

/** Max retry attempts for failed feed fetches */
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 3000]; // exponential-ish backoff

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

/** Sleep helper for retry backoff */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchFeed(url: string, feedName: string): Promise<IntelItem[]> {
  if (!isUrlSafe(url)) return [];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create fresh parser with rotated User-Agent for each attempt
      const p = createParser();
      const feed = await p.parseURL(url);
      return (feed.items || []).slice(0, 30).map((item, idx) => {
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
      // If we have retries left, wait and try with a different UA
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      return [];
    }
  }
  return [];
}
