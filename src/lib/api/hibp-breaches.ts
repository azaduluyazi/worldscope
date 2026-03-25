/**
 * HaveIBeenPwned — Data Breach List.
 * Source: https://haveibeenpwned.com/api/v3/breaches
 * No API key required for breach list endpoint.
 */

import type { IntelItem } from "@/types/intel";

interface HibpBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  Description: string;
  PwnCount: number;
  DataClasses: string[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
}

export async function fetchHibpBreaches(limit = 20): Promise<IntelItem[]> {
  try {
    const res = await fetch("https://haveibeenpwned.com/api/v3/breaches", {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "WorldScope/1.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data: HibpBreach[] = await res.json();

    const sorted = [...data].sort(
      (a, b) => new Date(b.BreachDate).getTime() - new Date(a.BreachDate).getTime()
    );

    return sorted.slice(0, limit).map((b, idx) => {
      const severity =
        b.PwnCount > 50_000_000
          ? "critical"
          : b.PwnCount > 10_000_000
          ? "high"
          : b.PwnCount > 1_000_000
          ? "medium"
          : "low";

      return {
        id: `hibp-${b.Name}-${idx}`,
        title: `Data Breach: ${b.Title} (${b.PwnCount.toLocaleString()} accounts)`,
        summary: stripHtml(b.Description).slice(0, 300),
        url: `https://haveibeenpwned.com/PwnedWebsites#${b.Name}`,
        source: "HaveIBeenPwned",
        category: "cyber" as const,
        severity,
        publishedAt: b.AddedDate
          ? new Date(b.AddedDate).toISOString()
          : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
