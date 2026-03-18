/**
 * PhishStats — Phishing site database with scoring.
 * Free, no API key required.
 * https://phishstats.info/
 */

import type { IntelItem, Severity } from "@/types/intel";

const PHISHSTATS_URL = "https://phishstats.info/phish_score.csv";

function scoreToSeverity(score: number): Severity {
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  if (score >= 2) return "low";
  return "info";
}

/**
 * Fetch top phishing sites from PhishStats CSV feed.
 * Parses CSV and returns the top 20 entries as IntelItems.
 */
export async function fetchPhishStats(limit = 20): Promise<IntelItem[]> {
  try {
    const res = await fetch(PHISHSTATS_URL, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "WorldScope/1.0" },
    });
    if (!res.ok) return [];

    const text = await res.text();
    const lines = text.split("\n").filter((l) => l.trim() && !l.startsWith("#"));

    // CSV format: date,score,url,ip
    return lines
      .slice(0, limit)
      .map((line, i): IntelItem | null => {
        const parts = line.split(",");
        if (parts.length < 4) return null;

        const date = parts[0]?.trim() || "";
        const score = parseFloat(parts[1]?.trim() || "0");
        const url = parts[2]?.trim().replace(/^"|"$/g, "") || "";
        const ip = parts[3]?.trim() || "";

        return {
          id: `phish-${i}-${Date.now()}`,
          title: `Phishing Site Detected: ${url.slice(0, 80)}`,
          summary: `Score: ${score}/10 | IP: ${ip} | Detected: ${date}`,
          url: url.startsWith("http") ? url : `https://phishstats.info/`,
          source: "PhishStats",
          category: "cyber" as const,
          severity: scoreToSeverity(score),
          publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        };
      })
      .filter((item): item is IntelItem => item !== null);
  } catch {
    return [];
  }
}
