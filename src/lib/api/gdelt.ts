import type { IntelItem, Category } from "@/types/intel";
import { mapSeverity } from "./rss-parser";

/**
 * GDELT Global Database of Events, Language, and Tone
 * Free, no API key required.
 * Provides real-time global event data with geocoordinates.
 * Docs: https://blog.gdeltproject.org/gdelt-geo-2-0-api-searching-the-world/
 */

interface GdeltArticle {
  url: string;
  url_mobile: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

interface GdeltGeoFeature {
  type: "Feature";
  properties: {
    name: string;
    html: string;
    url: string;
    shareimage: string;
    tonez: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
}

interface GdeltGeoResponse {
  type: "FeatureCollection";
  features: GdeltGeoFeature[];
}

const GDELT_BASE = "https://api.gdeltproject.org/api/v2";

// Map GDELT themes to our categories
function mapGdeltCategory(title: string): Category {
  const lower = title.toLowerCase();
  if (/military|weapon|conflict|war|attack|army|troops/.test(lower)) return "conflict";
  if (/cyber|hack|breach|ransomware/.test(lower)) return "cyber";
  if (/market|stock|economy|trade|bank|inflation/.test(lower)) return "finance";
  if (/earthquake|flood|hurricane|tsunami|wildfire/.test(lower)) return "natural";
  if (/protest|riot|demonstration|unrest/.test(lower)) return "protest";
  if (/terror|bomb|explosion/.test(lower)) return "conflict";
  if (/diplomat|treaty|sanction|summit|un |nato/.test(lower)) return "diplomacy";
  if (/health|virus|pandemic|outbreak|who/.test(lower)) return "health";
  if (/oil|gas|energy|nuclear|pipeline/.test(lower)) return "energy";
  if (/flight|airline|aviation|airport/.test(lower)) return "aviation";
  return "diplomacy";
}

/**
 * Fetch latest articles from GDELT Doc API
 * Returns global news with metadata (no coordinates from this endpoint)
 */
// GDELT language codes
const GDELT_LANGS: Record<string, string> = {
  en: "English", tr: "Turkish", ar: "Arabic", de: "German", es: "Spanish",
  fr: "French", ja: "Japanese", ko: "Korean", ru: "Russian", zh: "Chinese",
};

export async function fetchGdeltArticles(
  query = "conflict OR crisis OR attack OR military",
  maxRecords = 30,
  lang = "en"
): Promise<IntelItem[]> {
  const sourceLang = GDELT_LANGS[lang] || "English";
  const params = new URLSearchParams({
    query,
    mode: "ArtList",
    maxrecords: String(maxRecords),
    format: "json",
    sort: "DateDesc",
    sourcelang: sourceLang,
  });

  try {
    const res = await fetch(`${GDELT_BASE}/doc/doc?${params}`, {
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const articles: GdeltArticle[] = data.articles || [];

    return articles.map((a) => ({
      id: `gdelt-${Buffer.from(a.url).toString("base64url").slice(0, 32)}`,
      title: a.title,
      summary: "",
      url: a.url,
      source: `GDELT/${a.domain}`,
      category: mapGdeltCategory(a.title),
      severity: mapSeverity(a.title),
      publishedAt: parseGdeltDate(a.seendate),
      imageUrl: a.socialimage || undefined,
      countryCode: a.sourcecountry || undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch geo-located events from GDELT Geo API
 * Returns events with lat/lng coordinates for map markers
 */
export async function fetchGdeltGeo(
  query = "conflict OR attack OR protest OR disaster",
  maxPoints = 50,
  lang = "en"
): Promise<IntelItem[]> {
  const sourceLang = GDELT_LANGS[lang] || "English";
  const params = new URLSearchParams({
    query,
    format: "GeoJSON",
    maxpoints: String(maxPoints),
    timespan: "24h",
    sourcelang: sourceLang,
  });

  try {
    const res = await fetch(`${GDELT_BASE}/geo/geo?${params}`, {
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return [];

    const data: GdeltGeoResponse = await res.json();

    return (data.features || []).map((f) => {
      // Extract title from HTML
      const titleMatch = f.properties.html?.match(/<b>(.*?)<\/b>/);
      const title = titleMatch?.[1] || f.properties.name || "GDELT Event";

      return {
        id: `gdelt-geo-${Buffer.from(f.properties.url || title).toString("base64url").slice(0, 32)}`,
        title,
        summary: f.properties.name || "",
        url: f.properties.url || "",
        source: "GDELT Geo",
        category: mapGdeltCategory(title),
        severity: mapSeverity(title),
        publishedAt: new Date().toISOString(),
        imageUrl: f.properties.shareimage || undefined,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    });
  } catch {
    return [];
  }
}

function parseGdeltDate(dateStr: string): string {
  // GDELT format: "20260317T130000Z" or similar
  try {
    if (dateStr.length === 14) {
      const y = dateStr.slice(0, 4);
      const m = dateStr.slice(4, 6);
      const d = dateStr.slice(6, 8);
      const h = dateStr.slice(8, 10);
      const min = dateStr.slice(10, 12);
      const s = dateStr.slice(12, 14);
      return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`).toISOString();
    }
    return new Date(dateStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
}
