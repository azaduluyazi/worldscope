import type { IntelItem, Severity } from "@/types/intel";

/**
 * NASA EONET (Earth Observatory Natural Event Tracker)
 * Free, no API key required.
 * Returns active natural events with coordinates.
 * Docs: https://eonet.gsfc.nasa.gov/docs/v3
 */

interface EonetEvent {
  id: string;
  title: string;
  link: string;
  categories: Array<{ id: string; title: string }>;
  geometry: Array<{
    date: string;
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  }>;
}

interface EonetResponse {
  events: EonetEvent[];
}

function eonetCategoryToSeverity(categoryTitle: string): Severity {
  const lower = categoryTitle.toLowerCase();
  if (lower.includes("volcano") || lower.includes("earthquake")) return "high";
  if (lower.includes("wildfire") || lower.includes("severe storm")) return "high";
  if (lower.includes("flood") || lower.includes("landslide")) return "medium";
  if (lower.includes("ice") || lower.includes("snow")) return "low";
  return "medium";
}

/**
 * Fetch active natural events from NASA EONET
 * Returns wildfires, volcanic eruptions, severe storms, etc.
 */
export async function fetchNasaEonet(
  days = 30,
  limit = 50
): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      `https://eonet.gsfc.nasa.gov/api/v3/events?days=${days}&limit=${limit}&status=open`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data: EonetResponse = await res.json();

    return data.events.map((event) => {
      const latestGeo = event.geometry[event.geometry.length - 1];
      const categoryTitle = event.categories[0]?.title || "Natural Event";

      return {
        id: `eonet-${event.id}`,
        title: event.title,
        summary: `Active ${categoryTitle.toLowerCase()} event tracked by NASA EONET`,
        url: event.link,
        source: "NASA EONET",
        category: "natural" as const,
        severity: eonetCategoryToSeverity(categoryTitle),
        publishedAt: latestGeo?.date || new Date().toISOString(),
        lat: latestGeo?.coordinates[1],
        lng: latestGeo?.coordinates[0],
      };
    });
  } catch {
    return [];
  }
}
