/**
 * GeoDB Cities — Global city, region, country data
 */

export interface GeoCity {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  population: number;
  latitude: number;
  longitude: number;
}

export async function fetchNearbyCities(lat: number, lng: number, radius = 100): Promise<GeoCity[]> {
  const apiKey = process.env.GEODB_API_KEY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["x-rapidapi-key"] = apiKey;

  try {
    const res = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/locations/${lat}${lng >= 0 ? "+" : ""}${lng}/nearbyCities?radius=${radius}&limit=10&sort=-population`,
      { signal: AbortSignal.timeout(8000), headers }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data || []).map((c: Record<string, unknown>): GeoCity => ({
      id: Number(c.id),
      name: String(c.city || c.name || ""),
      country: String(c.country || ""),
      countryCode: String(c.countryCode || ""),
      population: Number(c.population || 0),
      latitude: Number(c.latitude || 0),
      longitude: Number(c.longitude || 0),
    }));
  } catch { return []; }
}
