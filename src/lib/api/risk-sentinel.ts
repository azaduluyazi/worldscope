/**
 * CISA Cybersecurity Advisories RSS Feed.
 * Source: https://www.cisa.gov/cybersecurity-advisories/all.xml
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";
import { fetchFeed } from "./rss-parser";

export async function fetchRiskSentinel(): Promise<IntelItem[]> {
  try {
    const items = await fetchFeed(
      "https://www.cisa.gov/cybersecurity-advisories/all.xml",
      "CISA Advisories"
    );
    return items.map((item) => ({
      ...item,
      category: "cyber" as const,
      severity: item.severity === "info" ? "medium" : item.severity,
    }));
  } catch {
    return [];
  }
}
