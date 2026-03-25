/**
 * GPS/SAR Interference — Known conflict-zone GPS jamming and spoofing.
 * Uses GPSJam.org crowdsourced data + static conflict zones.
 * Replaces: Bellingcat SAR tracker (repo structure changed, GeoJSON 404).
 */

import type { IntelItem, Severity } from "@/types/intel";

// Known GPS jamming/spoofing hotspots — updated from OPSGROUP, Eurocontrol reports
const JAMMING_ZONES: Array<{
  region: string;
  lat: number;
  lng: number;
  severity: Severity;
  description: string;
  active: boolean;
}> = [
  { region: "Eastern Mediterranean (Syria/Lebanon)", lat: 34.8, lng: 36.2, severity: "critical", description: "Persistent GPS spoofing affecting civilian aviation. Source: likely Russian EW systems at Khmeimim AB.", active: true },
  { region: "Black Sea (Ukraine/Crimea)", lat: 44.5, lng: 33.5, severity: "critical", description: "GPS jamming around Crimea affecting maritime and aviation. Active conflict zone EW.", active: true },
  { region: "Baltic Region (Kaliningrad)", lat: 54.7, lng: 20.5, severity: "high", description: "Intermittent GPS jamming from Kaliningrad exclave. Affects Baltic states and Finland aviation.", active: true },
  { region: "Iraq/Iran Border", lat: 33.5, lng: 45.5, severity: "high", description: "GPS spoofing affecting commercial aviation routes over Iraq.", active: true },
  { region: "Northern Norway/Finland", lat: 69.0, lng: 25.0, severity: "medium", description: "Cross-border GPS interference from Russian Kola Peninsula military installations.", active: true },
  { region: "Israel/Gaza", lat: 31.5, lng: 34.5, severity: "critical", description: "Active GPS spoofing and jamming in conflict zone. Affects Ben Gurion approach.", active: true },
  { region: "Red Sea/Yemen", lat: 15.0, lng: 42.5, severity: "high", description: "GPS interference associated with Houthi operations affecting shipping lanes.", active: true },
  { region: "South China Sea", lat: 16.0, lng: 112.0, severity: "medium", description: "Suspected GPS manipulation near disputed islands and military installations.", active: true },
  { region: "India-Pakistan Border (Kashmir)", lat: 34.0, lng: 76.0, severity: "medium", description: "Localized GPS jamming along Line of Control.", active: true },
  { region: "North Korea Border", lat: 37.9, lng: 126.7, severity: "high", description: "Periodic GPS jamming from North Korea affecting South Korean aviation and maritime.", active: true },
];

/**
 * Fetch GPS/SAR interference intel — static zones + GPSJam check.
 */
export async function fetchSarInterference(): Promise<IntelItem[]> {
  const items: IntelItem[] = JAMMING_ZONES
    .filter((z) => z.active)
    .map((z): IntelItem => ({
      id: `gps-jam-${z.region.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
      title: `📡 GPS Interference: ${z.region}`,
      summary: z.description,
      url: "https://gpsjam.org/",
      source: "GPS Jamming Monitor",
      category: "conflict",
      severity: z.severity,
      publishedAt: new Date().toISOString(),
      lat: z.lat,
      lng: z.lng,
    }));

  // Try to fetch live data from GPSJam (if available)
  try {
    const res = await fetch("https://gpsjam.org/api/interference?days=1", {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const live = data.slice(0, 10).map((d: Record<string, unknown>, i: number): IntelItem => ({
          id: `gpsjam-live-${i}-${Date.now()}`,
          title: `📡 LIVE GPS Interference: ${d.region || "Unknown"}`,
          summary: `Live interference detected. Intensity: ${d.intensity || "N/A"}`,
          url: "https://gpsjam.org/",
          source: "GPSJam Live",
          category: "conflict",
          severity: "high",
          publishedAt: String(d.timestamp || new Date().toISOString()),
          lat: Number(d.lat) || 0,
          lng: Number(d.lng) || 0,
        }));
        return [...live, ...items];
      }
    }
  } catch {
    // GPSJam API may not be public — fallback to static zones
  }

  return items;
}
