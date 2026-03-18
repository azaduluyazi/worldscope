/**
 * FBI Most Wanted — Public API for wanted persons and fugitives.
 * Free, no API key required.
 * https://api.fbi.gov/wanted/v1/list
 */

import type { IntelItem, Severity } from "@/types/intel";

interface FbiWanted {
  uid: string;
  title: string;
  description: string;
  subjects: string[];
  aliases: string[] | null;
  warning_message: string | null;
  reward_text: string | null;
  url: string;
  images: Array<{ original: string; thumb: string; caption: string | null }>;
  publication: string;
  modified: string;
  nationality: string | null;
  place_of_birth: string | null;
  dates_of_birth_used: string[] | null;
  status: string;
}

interface FbiResponse {
  total: number;
  items: FbiWanted[];
  page: number;
}

function classifySeverity(item: FbiWanted): Severity {
  if (item.warning_message?.toLowerCase().includes("armed and dangerous")) return "critical";
  if (item.subjects?.some((s) => s.toLowerCase().includes("terrorism"))) return "critical";
  if (item.reward_text) return "high";
  return "medium";
}

/**
 * Fetch FBI Most Wanted list.
 * Returns wanted persons and fugitives as IntelItems.
 */
export async function fetchFbiWanted(limit = 20): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      `https://api.fbi.gov/wanted/v1/list?pageSize=${limit}&sort_on=modified&sort_order=desc`,
      {
        signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return [];

    const data: FbiResponse = await res.json();
    if (!Array.isArray(data.items)) return [];

    return data.items.map((item): IntelItem => {
      const subjects = item.subjects?.join(", ") || "Fugitive";
      const warning = item.warning_message ? ` | WARNING: ${item.warning_message}` : "";

      return {
        id: `fbi-${item.uid}`,
        title: `FBI Wanted: ${item.title}`,
        summary: `Subjects: ${subjects}${warning} | Status: ${item.status || "Unknown"}`,
        url: item.url || "https://www.fbi.gov/wanted",
        source: "FBI Most Wanted",
        category: "conflict",
        severity: classifySeverity(item),
        publishedAt: item.modified || item.publication || new Date().toISOString(),
        imageUrl: item.images?.[0]?.thumb || undefined,
      };
    });
  } catch {
    return [];
  }
}
