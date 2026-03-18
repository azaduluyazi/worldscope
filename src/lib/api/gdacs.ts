/**
 * GDACS — Global Disaster Alerting Coordination System. No key required.
 * https://www.gdacs.org/
 */

import type { IntelItem } from "@/types/intel";

/** Fetch active GDACS disaster alerts via RSS-to-JSON */
export async function fetchGDACSAlerts(): Promise<IntelItem[]> {
  try {
    const res = await fetch("https://www.gdacs.org/xml/rss.xml", {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/xml, text/xml" },
    });
    if (!res.ok) return [];

    const xml = await res.text();

    // Simple XML parsing for RSS items
    const items: IntelItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1];
      const title = content.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] || content.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const desc = content.match(/<description><!\[CDATA\[(.*?)\]\]>/)?.[1] || content.match(/<description>(.*?)<\/description>/)?.[1] || "";
      const link = content.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const lat = content.match(/<geo:lat>(.*?)<\/geo:lat>/)?.[1];
      const lng = content.match(/<geo:long>(.*?)<\/geo:long>/)?.[1];

      // Determine severity from title/description
      const text = `${title} ${desc}`.toLowerCase();
      const severity = text.includes("red") || text.includes("extreme") ? "critical" as const
        : text.includes("orange") || text.includes("severe") ? "high" as const
        : text.includes("green") ? "low" as const
        : "medium" as const;

      items.push({
        id: `gdacs-${items.length}-${Date.now()}`,
        title: title.slice(0, 200),
        summary: desc.replace(/<[^>]+>/g, "").slice(0, 300),
        url: link || "https://www.gdacs.org/",
        source: "GDACS",
        category: "natural",
        severity,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
      });

      if (items.length >= 20) break;
    }

    return items;
  } catch {
    return [];
  }
}
