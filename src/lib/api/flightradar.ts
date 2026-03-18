import type { IntelItem, Severity } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

/**
 * Aviation Safety Network RSS — Aviation incident reports.
 * Free, no API key required. Parses RSS XML feed.
 * Source: https://aviation-safety.net/
 */

const ASN_RSS = "https://aviation-safety.net/rss/recent.xml";

// SSRF protection: only allow the known ASN RSS URL
const ALLOWED_HOSTS = ["aviation-safety.net"];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export async function fetchAviationIncidents(): Promise<IntelItem[]> {
  if (!isAllowedUrl(ASN_RSS)) return [];

  return cachedFetch<IntelItem[]>(
    "aviation:incidents",
    async () => {
      try {
        const res = await fetch(ASN_RSS, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];

        const xml = await res.text();
        // Simple XML parser for RSS items
        const items: IntelItem[] = [];
        const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

        for (const item of itemMatches.slice(0, 15)) {
          const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "";
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
          const desc =
            item.match(/<description>(.*?)<\/description>/)?.[1] || "";
          const pubDate =
            item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

          const isFatal = /fatal|crash|killed|dead/i.test(title + desc);
          const severity: Severity = isFatal
            ? "critical"
            : /incident|emergency/i.test(title)
              ? "high"
              : "medium";

          items.push({
            id: `asn-${Buffer.from(link).toString("base64url").slice(0, 20)}`,
            title: title.replace(/<!\[CDATA\[|\]\]>/g, ""),
            summary: desc.replace(/<!\[CDATA\[|\]\]>/g, "").slice(0, 300),
            url: link,
            source: "Aviation Safety Network",
            category: "aviation",
            severity,
            publishedAt: pubDate
              ? new Date(pubDate).toISOString()
              : new Date().toISOString(),
          });
        }

        return items;
      } catch {
        return [];
      }
    },
    TTL.NEWS
  );
}
