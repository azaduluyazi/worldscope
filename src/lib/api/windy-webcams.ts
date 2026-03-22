/**
 * Windy Webcams API v3 — Global webcam database.
 * Free API key required (register at api.windy.com).
 * Docs: https://api.windy.com/webcams/docs
 */

export interface Webcam {
  id: string;
  title: string;
  location: {
    city: string;
    region: string;
    country: string;
    countryCode: string;
    lat: number;
    lng: number;
  };
  imageUrl: string;
  playerUrl: string;
  lastUpdated: string;
}

const WINDY_BASE = "https://api.windy.com/webcams/api/v3/webcams";

export async function fetchNearbyWebcams(
  lat: number,
  lng: number,
  radiusKm = 50,
  limit = 10
): Promise<Webcam[]> {
  const key = process.env.WINDY_WEBCAMS_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `${WINDY_BASE}?nearby=${lat},${lng},${radiusKm}&limit=${limit}&include=images,location,player`,
      {
        headers: { "x-windy-api-key": key },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data?.webcams || []).map((cam: Record<string, unknown>) => {
      const loc = cam.location as Record<string, unknown> || {};
      const images = cam.images as Record<string, Record<string, string>> || {};
      const player = cam.player as Record<string, Record<string, string>> || {};
      return {
        id: String(cam.webcamId || cam.id || ""),
        title: String(cam.title || ""),
        location: {
          city: String(loc.city || ""),
          region: String(loc.region || ""),
          country: String(loc.country || ""),
          countryCode: String(loc.countryCode || ""),
          lat: Number(loc.latitude || 0),
          lng: Number(loc.longitude || 0),
        },
        imageUrl: images?.current?.preview || images?.current?.thumbnail || "",
        playerUrl: player?.day?.embed || "",
        lastUpdated: String(cam.lastUpdatedOn || new Date().toISOString()),
      };
    });
  } catch {
    return [];
  }
}

export async function fetchWebcamsByCountry(
  countryCode: string,
  limit = 20
): Promise<Webcam[]> {
  const key = process.env.WINDY_WEBCAMS_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `${WINDY_BASE}?countries=${countryCode}&limit=${limit}&include=images,location,player`,
      {
        headers: { "x-windy-api-key": key },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data?.webcams || []).map((cam: Record<string, unknown>) => {
      const loc = cam.location as Record<string, unknown> || {};
      const images = cam.images as Record<string, Record<string, string>> || {};
      const player = cam.player as Record<string, Record<string, string>> || {};
      return {
        id: String(cam.webcamId || cam.id || ""),
        title: String(cam.title || ""),
        location: {
          city: String(loc.city || ""),
          region: String(loc.region || ""),
          country: String(loc.country || ""),
          countryCode: String(loc.countryCode || ""),
          lat: Number(loc.latitude || 0),
          lng: Number(loc.longitude || 0),
        },
        imageUrl: images?.current?.preview || images?.current?.thumbnail || "",
        playerUrl: player?.day?.embed || "",
        lastUpdated: String(cam.lastUpdatedOn || new Date().toISOString()),
      };
    });
  } catch {
    return [];
  }
}
