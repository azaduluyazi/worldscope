/**
 * Cloudflare Radar API — Internet outage detection.
 * Free tier available with API token.
 * https://developers.cloudflare.com/radar/
 */

export interface InternetOutage {
  id: string;
  name: string;         // Country or ASN name
  type: string;         // "country" | "asn"
  startTime: string;
  endTime: string | null;
  score: number;        // severity 0-1
  location?: { lat: number; lng: number };
}

const RADAR_BASE = "https://api.cloudflare.com/client/v4/radar";

/** Fetch recent internet outage events from Cloudflare Radar */
export async function fetchInternetOutages(): Promise<InternetOutage[]> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `${RADAR_BASE}/annotations/outages?limit=20&format=json`,
      {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    const annotations = data?.result?.annotations;
    if (!Array.isArray(annotations)) return [];

    return annotations.map((a: Record<string, unknown>): InternetOutage => ({
      id: String(a.id || ""),
      name: String(a.description || a.asn || "Unknown"),
      type: a.asn ? "asn" : "country",
      startTime: String(a.startDate || ""),
      endTime: a.endDate ? String(a.endDate) : null,
      score: Number(a.scope === "country" ? 0.8 : 0.5),
    }));
  } catch {
    return [];
  }
}
