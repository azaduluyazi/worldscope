/**
 * GeoJSON/JSON Layer Loader with in-memory cache.
 * Loads static data files from /geo/ on demand when layers are enabled.
 * Files are fetched once and cached for the session lifetime.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
  name: string;
  [key: string]: unknown;
}

const cache = new Map<string, GeoPoint[]>();
const inflight = new Map<string, Promise<GeoPoint[]>>();

/**
 * Load a JSON array of geo points from a URL (typically /geo/*.json).
 * Results are cached in memory — subsequent calls return instantly.
 * @param url - Path to JSON file (e.g. "/geo/volcanoes.json")
 * @param maxPoints - Maximum number of points to return (performance cap)
 */
export async function loadGeoPoints(url: string, maxPoints = 500): Promise<GeoPoint[]> {
  // Return cached data if available
  const cached = cache.get(url);
  if (cached) return cached.slice(0, maxPoints);

  // Deduplicate concurrent requests for the same URL
  const existing = inflight.get(url);
  if (existing) {
    const result = await existing;
    return result.slice(0, maxPoints);
  }

  const promise = fetchAndParse(url);
  inflight.set(url, promise);

  try {
    const points = await promise;
    cache.set(url, points);
    return points.slice(0, maxPoints);
  } finally {
    inflight.delete(url);
  }
}

async function fetchAndParse(url: string): Promise<GeoPoint[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    // Normalize: ensure every item has lat/lng
    return data.filter(
      (item: Record<string, unknown>) =>
        typeof item.lat === "number" &&
        typeof item.lng === "number" &&
        isFinite(item.lat as number) &&
        isFinite(item.lng as number)
    ) as GeoPoint[];
  } catch {
    return [];
  }
}

/**
 * Clear cached data for a specific URL or all URLs.
 */
export function clearGeoCache(url?: string): void {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}

/**
 * Check if a URL is already cached.
 */
export function isGeoCached(url: string): boolean {
  return cache.has(url);
}
