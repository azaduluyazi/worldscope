import type { IntelItem } from "@/types/intel";

const WHO_DON_API = "https://www.who.int/api/hubs/diseaseoutbreaknews";

interface WhoDon {
  Id: string;
  Title: string;
  Summary: string;
  PublicationDate: string;
  DiseaseType: string;
  Country: string;
  Url: string;
}

/**
 * Fetch WHO Disease Outbreak News.
 * Returns recent disease outbreaks and health emergencies.
 */
export async function fetchWhoOutbreaks(limit = 15): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${WHO_DON_API}?$top=${limit}&$orderby=PublicationDate desc`, {
      headers: { "User-Agent": "WorldScope/1.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const items: WhoDon[] = data.value || [];

    return items.map((item) => {
      // Classify severity based on keywords
      const titleLower = (item.Title + " " + item.Summary).toLowerCase();
      const isCritical =
        titleLower.includes("pandemic") ||
        titleLower.includes("emergency") ||
        titleLower.includes("pheic");
      const isHigh =
        titleLower.includes("outbreak") ||
        titleLower.includes("epidemic") ||
        titleLower.includes("death");

      return {
        id: `who-${item.Id}`,
        title: item.Title,
        summary: item.Summary?.slice(0, 300) || "",
        url: item.Url || `https://www.who.int/emergencies/disease-outbreak-news/${item.Id}`,
        source: "WHO",
        category: "health" as const,
        severity: isCritical ? "critical" : isHigh ? "high" : "medium",
        publishedAt: item.PublicationDate,
      };
    });
  } catch {
    return [];
  }
}
