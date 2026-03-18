/**
 * Geo-enrichment: Extracts country/city mentions from news titles
 * and assigns approximate coordinates to items without lat/lng.
 *
 * This spreads markers across the globe instead of clustering
 * only where API sources return native coordinates.
 */

import type { IntelItem } from "@/types/intel";

interface GeoPoint {
  lat: number;
  lng: number;
  code?: string; // ISO country code
}

/**
 * Major countries and cities with approximate center coordinates.
 * Keys are lowercase for case-insensitive matching.
 * Ordered by geopolitical importance for conflict/finance monitoring.
 */
const GEO_LOOKUP: Record<string, GeoPoint> = {
  // ── Middle East ──
  iran: { lat: 32.43, lng: 53.69, code: "IR" },
  tehran: { lat: 35.69, lng: 51.39, code: "IR" },
  israel: { lat: 31.05, lng: 34.85, code: "IL" },
  "tel aviv": { lat: 32.08, lng: 34.78, code: "IL" },
  jerusalem: { lat: 31.77, lng: 35.23, code: "IL" },
  gaza: { lat: 31.35, lng: 34.31, code: "PS" },
  palestine: { lat: 31.95, lng: 35.23, code: "PS" },
  "west bank": { lat: 31.95, lng: 35.25, code: "PS" },
  lebanon: { lat: 33.85, lng: 35.86, code: "LB" },
  beirut: { lat: 33.89, lng: 35.50, code: "LB" },
  hezbollah: { lat: 33.85, lng: 35.86, code: "LB" },
  syria: { lat: 34.80, lng: 38.99, code: "SY" },
  damascus: { lat: 33.51, lng: 36.29, code: "SY" },
  iraq: { lat: 33.22, lng: 43.68, code: "IQ" },
  baghdad: { lat: 33.31, lng: 44.37, code: "IQ" },
  "saudi arabia": { lat: 23.89, lng: 45.08, code: "SA" },
  riyadh: { lat: 24.71, lng: 46.67, code: "SA" },
  yemen: { lat: 15.55, lng: 48.52, code: "YE" },
  houthi: { lat: 15.35, lng: 44.21, code: "YE" },
  qatar: { lat: 25.35, lng: 51.18, code: "QA" },
  uae: { lat: 23.42, lng: 53.85, code: "AE" },
  dubai: { lat: 25.20, lng: 55.27, code: "AE" },
  oman: { lat: 21.47, lng: 55.98, code: "OM" },
  bahrain: { lat: 26.07, lng: 50.55, code: "BH" },
  jordan: { lat: 30.59, lng: 36.24, code: "JO" },
  kuwait: { lat: 29.31, lng: 47.48, code: "KW" },

  // ── Europe ──
  ukraine: { lat: 48.38, lng: 31.17, code: "UA" },
  kyiv: { lat: 50.45, lng: 30.52, code: "UA" },
  russia: { lat: 61.52, lng: 105.32, code: "RU" },
  moscow: { lat: 55.76, lng: 37.62, code: "RU" },
  kremlin: { lat: 55.75, lng: 37.62, code: "RU" },
  putin: { lat: 55.76, lng: 37.62, code: "RU" },
  "united kingdom": { lat: 55.38, lng: -3.44, code: "GB" },
  london: { lat: 51.51, lng: -0.13, code: "GB" },
  britain: { lat: 55.38, lng: -3.44, code: "GB" },
  france: { lat: 46.23, lng: 2.21, code: "FR" },
  paris: { lat: 48.86, lng: 2.35, code: "FR" },
  germany: { lat: 51.17, lng: 10.45, code: "DE" },
  berlin: { lat: 52.52, lng: 13.41, code: "DE" },
  italy: { lat: 41.87, lng: 12.57, code: "IT" },
  rome: { lat: 41.90, lng: 12.50, code: "IT" },
  spain: { lat: 40.46, lng: -3.75, code: "ES" },
  madrid: { lat: 40.42, lng: -3.70, code: "ES" },
  poland: { lat: 51.92, lng: 19.15, code: "PL" },
  warsaw: { lat: 52.23, lng: 21.01, code: "PL" },
  greece: { lat: 39.07, lng: 21.82, code: "GR" },
  sweden: { lat: 60.13, lng: 18.64, code: "SE" },
  norway: { lat: 60.47, lng: 8.47, code: "NO" },
  finland: { lat: 61.92, lng: 25.75, code: "FI" },
  netherlands: { lat: 52.13, lng: 5.29, code: "NL" },
  belgium: { lat: 50.50, lng: 4.47, code: "BE" },
  brussels: { lat: 50.85, lng: 4.35, code: "BE" },
  switzerland: { lat: 46.82, lng: 8.23, code: "CH" },
  austria: { lat: 47.52, lng: 14.55, code: "AT" },
  romania: { lat: 45.94, lng: 24.97, code: "RO" },
  hungary: { lat: 47.16, lng: 19.50, code: "HU" },
  serbia: { lat: 44.02, lng: 21.01, code: "RS" },
  croatia: { lat: 45.10, lng: 15.20, code: "HR" },
  portugal: { lat: 39.40, lng: -8.22, code: "PT" },
  czech: { lat: 49.82, lng: 15.47, code: "CZ" },
  nato: { lat: 50.88, lng: 4.43, code: "BE" },
  "european union": { lat: 50.85, lng: 4.35, code: "BE" },

  // ── Turkey ──
  turkey: { lat: 38.96, lng: 35.24, code: "TR" },
  türkiye: { lat: 38.96, lng: 35.24, code: "TR" },
  istanbul: { lat: 41.01, lng: 28.98, code: "TR" },
  ankara: { lat: 39.93, lng: 32.86, code: "TR" },
  erdogan: { lat: 39.93, lng: 32.86, code: "TR" },

  // ── Asia ──
  china: { lat: 35.86, lng: 104.20, code: "CN" },
  beijing: { lat: 39.90, lng: 116.41, code: "CN" },
  shanghai: { lat: 31.23, lng: 121.47, code: "CN" },
  taiwan: { lat: 23.70, lng: 120.96, code: "TW" },
  taipei: { lat: 25.03, lng: 121.57, code: "TW" },
  japan: { lat: 36.20, lng: 138.25, code: "JP" },
  tokyo: { lat: 35.68, lng: 139.69, code: "JP" },
  "south korea": { lat: 35.91, lng: 127.77, code: "KR" },
  seoul: { lat: 37.57, lng: 126.98, code: "KR" },
  "north korea": { lat: 40.34, lng: 127.51, code: "KP" },
  pyongyang: { lat: 39.04, lng: 125.76, code: "KP" },
  india: { lat: 20.59, lng: 78.96, code: "IN" },
  "new delhi": { lat: 28.61, lng: 77.21, code: "IN" },
  mumbai: { lat: 19.08, lng: 72.88, code: "IN" },
  pakistan: { lat: 30.38, lng: 69.35, code: "PK" },
  islamabad: { lat: 33.69, lng: 73.04, code: "PK" },
  afghanistan: { lat: 33.94, lng: 67.71, code: "AF" },
  kabul: { lat: 34.53, lng: 69.17, code: "AF" },
  taliban: { lat: 33.94, lng: 67.71, code: "AF" },
  myanmar: { lat: 21.91, lng: 95.96, code: "MM" },
  philippines: { lat: 12.88, lng: 121.77, code: "PH" },
  indonesia: { lat: -0.79, lng: 113.92, code: "ID" },
  vietnam: { lat: 14.06, lng: 108.28, code: "VN" },
  thailand: { lat: 15.87, lng: 100.99, code: "TH" },
  malaysia: { lat: 4.21, lng: 101.98, code: "MY" },
  singapore: { lat: 1.35, lng: 103.82, code: "SG" },
  bangladesh: { lat: 23.68, lng: 90.36, code: "BD" },

  // ── Americas ──
  "united states": { lat: 37.09, lng: -95.71, code: "US" },
  washington: { lat: 38.91, lng: -77.04, code: "US" },
  "new york": { lat: 40.71, lng: -74.01, code: "US" },
  pentagon: { lat: 38.87, lng: -77.06, code: "US" },
  "white house": { lat: 38.90, lng: -77.04, code: "US" },
  trump: { lat: 38.90, lng: -77.04, code: "US" },
  biden: { lat: 38.90, lng: -77.04, code: "US" },
  canada: { lat: 56.13, lng: -106.35, code: "CA" },
  mexico: { lat: 23.63, lng: -102.55, code: "MX" },
  brazil: { lat: -14.24, lng: -51.93, code: "BR" },
  argentina: { lat: -38.42, lng: -63.62, code: "AR" },
  colombia: { lat: 4.57, lng: -74.30, code: "CO" },
  venezuela: { lat: 6.42, lng: -66.59, code: "VE" },
  chile: { lat: -35.68, lng: -71.54, code: "CL" },
  peru: { lat: -9.19, lng: -75.02, code: "PE" },
  cuba: { lat: 21.52, lng: -77.78, code: "CU" },

  // ── Africa ──
  egypt: { lat: 26.82, lng: 30.80, code: "EG" },
  cairo: { lat: 30.04, lng: 31.24, code: "EG" },
  "south africa": { lat: -30.56, lng: 22.94, code: "ZA" },
  nigeria: { lat: 9.08, lng: 8.68, code: "NG" },
  ethiopia: { lat: 9.15, lng: 40.49, code: "ET" },
  kenya: { lat: -0.02, lng: 37.91, code: "KE" },
  sudan: { lat: 12.86, lng: 30.22, code: "SD" },
  libya: { lat: 26.34, lng: 17.23, code: "LY" },
  morocco: { lat: 31.79, lng: -7.09, code: "MA" },
  tunisia: { lat: 33.89, lng: 9.54, code: "TN" },
  algeria: { lat: 28.03, lng: 1.66, code: "DZ" },
  somalia: { lat: 5.15, lng: 46.20, code: "SO" },
  congo: { lat: -4.04, lng: 21.76, code: "CD" },
  mali: { lat: 17.57, lng: -4.00, code: "ML" },
  mozambique: { lat: -18.67, lng: 35.53, code: "MZ" },

  // ── Oceania ──
  australia: { lat: -25.27, lng: 133.78, code: "AU" },
  "new zealand": { lat: -40.90, lng: 174.89, code: "NZ" },

  // ── Conflict zones / Common terms ──
  "strait of hormuz": { lat: 26.59, lng: 56.26 },
  "south china sea": { lat: 12.0, lng: 113.0 },
  "black sea": { lat: 43.17, lng: 34.17 },
  "red sea": { lat: 20.0, lng: 38.0 },
  crimea: { lat: 44.95, lng: 34.10, code: "UA" },
  donbas: { lat: 48.02, lng: 37.80, code: "UA" },
  "wall street": { lat: 40.71, lng: -74.01, code: "US" },
};

/**
 * Add slight random jitter to prevent markers from stacking exactly.
 * Jitter: ±0.5 degrees (~50km at equator)
 */
function jitter(val: number, range = 0.5): number {
  return val + (Math.random() - 0.5) * range * 2;
}

/**
 * Search text for geographic mentions and return the first match.
 * Longer keys are checked first to avoid "iran" matching inside "iranian".
 */
const sortedKeys = Object.keys(GEO_LOOKUP).sort((a, b) => b.length - a.length);

function extractGeo(text: string): GeoPoint | null {
  const lower = text.toLowerCase();

  for (const key of sortedKeys) {
    // Word boundary check: ensure the match isn't part of a longer word
    const idx = lower.indexOf(key);
    if (idx === -1) continue;

    // Check word boundary before
    if (idx > 0) {
      const charBefore = lower[idx - 1];
      if (/[a-z]/.test(charBefore)) continue;
    }

    // Check word boundary after
    const afterIdx = idx + key.length;
    if (afterIdx < lower.length) {
      const charAfter = lower[afterIdx];
      if (/[a-z]/.test(charAfter)) continue;
    }

    return GEO_LOOKUP[key];
  }

  return null;
}

/**
 * Enrich IntelItems that lack coordinates by scanning their title and summary
 * for country/city mentions. Adds approximate lat/lng with jitter.
 *
 * Items that already have valid coordinates are left unchanged.
 */
export function enrichGeoData(items: IntelItem[]): IntelItem[] {
  return items.map((item) => {
    // Already has coordinates — skip
    if (item.lat != null && item.lng != null) return item;

    // Try title first, then summary
    const geo = extractGeo(item.title) || extractGeo(item.summary || "");
    if (!geo) return item;

    return {
      ...item,
      lat: jitter(geo.lat),
      lng: jitter(geo.lng),
      countryCode: geo.code || item.countryCode,
    };
  });
}
