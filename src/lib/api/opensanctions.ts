/**
 * OpenSanctions — Global sanctions, PEPs, and wanted persons database.
 * Free API with optional API key for higher limits.
 * https://www.opensanctions.org/docs/api/
 */

import type { IntelItem, Severity } from "@/types/intel";

interface OpenSanctionsEntity {
  id: string;
  caption: string;
  schema: string;
  properties: {
    name?: string[];
    country?: string[];
    topics?: string[];
    notes?: string[];
    description?: string[];
    sourceUrl?: string[];
    modifiedAt?: string[];
  };
  datasets: string[];
  referents: string[];
  last_change: string;
  last_seen: string;
  first_seen: string;
  target: boolean;
}

interface OpenSanctionsResponse {
  limit: number;
  offset: number;
  total: {
    value: number;
    relation: string;
  };
  results: OpenSanctionsEntity[];
}

function topicToSeverity(topics: string[]): Severity {
  if (topics.some((t) => t === "sanction")) return "high";
  if (topics.some((t) => t === "crime" || t === "wanted")) return "critical";
  if (topics.some((t) => t === "pep")) return "medium";
  return "info";
}

/**
 * Search OpenSanctions for sanctioned entities.
 * Returns matched entities as IntelItems.
 */
export async function fetchSanctions(query = "", limit = 20): Promise<IntelItem[]> {
  try {
    const apiKey = process.env.OPENSANCTIONS_API_KEY;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "WorldScope/1.0",
    };
    if (apiKey) headers["Authorization"] = `ApiKey ${apiKey}`;

    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });

    const res = await fetch(
      `https://api.opensanctions.org/search/default?${params}`,
      {
        signal: AbortSignal.timeout(10000),
        headers,
      }
    );
    if (!res.ok) return [];

    const data: OpenSanctionsResponse = await res.json();
    if (!Array.isArray(data.results)) return [];

    return data.results.map((entity): IntelItem => {
      const topics = entity.properties.topics || [];
      const countries = entity.properties.country?.join(", ") || "Unknown";
      const description = entity.properties.description?.[0] ||
        entity.properties.notes?.[0] || "";
      const datasets = entity.datasets?.join(", ") || "";

      return {
        id: `sanctions-${entity.id}`,
        title: `Sanctions: ${entity.caption} (${entity.schema})`,
        summary: `Countries: ${countries} | Topics: ${topics.join(", ") || "N/A"} | Datasets: ${datasets}${description ? ` | ${description.slice(0, 120)}` : ""}`,
        url: entity.properties.sourceUrl?.[0] || `https://www.opensanctions.org/entities/${entity.id}/`,
        source: "OpenSanctions",
        category: "diplomacy",
        severity: topicToSeverity(topics),
        publishedAt: entity.last_change || entity.first_seen || new Date().toISOString(),
        countryCode: entity.properties.country?.[0] || undefined,
      };
    });
  } catch {
    return [];
  }
}
