/**
 * SpaceX API + Launch Library — Space launches. No key required.
 */

import type { IntelItem } from "@/types/intel";

/** Fetch upcoming SpaceX launches */
export async function fetchSpaceXLaunches(): Promise<IntelItem[]> {
  try {
    const res = await fetch("https://api.spacexdata.com/v5/launches/upcoming", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 10).map((l: Record<string, unknown>): IntelItem => ({
      id: `spacex-${l.id || Date.now()}`,
      title: `SpaceX Launch: ${l.name || "Unknown Mission"}`,
      summary: `Flight #${l.flight_number || "?"} | ${l.details || "No details available"}`.slice(0, 300),
      url: String(l.links && (l.links as Record<string, unknown>).webcast || "https://www.spacex.com/launches/"),
      source: "SpaceX",
      category: "tech",
      severity: "info",
      publishedAt: String(l.date_utc || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

/** Fetch upcoming launches from Launch Library 2 */
export async function fetchLaunchLibrary(): Promise<IntelItem[]> {
  try {
    const res = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&mode=list", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.results) return [];

    return data.results.map((l: Record<string, unknown>): IntelItem => ({
      id: `launch-${l.id || Date.now()}`,
      title: `Launch: ${l.name || "Unknown"}`,
      summary: `Provider: ${(l.launch_service_provider as Record<string, string>)?.name || "?"} | Status: ${(l.status as Record<string, string>)?.name || "?"}`,
      url: String(l.url || "https://thespacedevs.com/"),
      source: "Launch Library",
      category: "tech",
      severity: "info",
      publishedAt: String(l.net || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}
