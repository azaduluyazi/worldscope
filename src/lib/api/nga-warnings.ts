/**
 * NGA Maritime Safety — Navigational Warnings
 * Uses NGA MSIS broadcast warnings when available, with fallback to
 * curated major warning areas for global maritime chokepoints.
 */

import { cachedFetch } from "@/lib/cache/redis";
import { TTL } from "@/lib/cache/redis";

export interface NavWarning {
  id: string;
  title: string;
  lat: number;
  lng: number;
  area: string;
  type: string;
  issued: string;
}

const MAJOR_WARNING_AREAS: NavWarning[] = [
  { id: "nav-hormuz", title: "Strait of Hormuz — Vessel Traffic Congestion", lat: 26.56, lng: 56.25, area: "Strait of Hormuz", type: "traffic", issued: new Date().toISOString() },
  { id: "nav-redsea", title: "Red Sea — Maritime Security Threat", lat: 15.50, lng: 41.80, area: "Red Sea / Bab el-Mandeb", type: "security", issued: new Date().toISOString() },
  { id: "nav-blacksea", title: "Black Sea — Naval Operations Zone", lat: 43.50, lng: 34.00, area: "Black Sea", type: "military", issued: new Date().toISOString() },
  { id: "nav-taiwan", title: "Taiwan Strait — Military Exercise Area", lat: 24.50, lng: 119.50, area: "Taiwan Strait", type: "military", issued: new Date().toISOString() },
  { id: "nav-malacca", title: "Strait of Malacca — Piracy Risk", lat: 2.50, lng: 101.50, area: "Strait of Malacca", type: "piracy", issued: new Date().toISOString() },
  { id: "nav-aden", title: "Gulf of Aden — Armed Robbery", lat: 12.00, lng: 47.00, area: "Gulf of Aden", type: "piracy", issued: new Date().toISOString() },
  { id: "nav-guinea", title: "Gulf of Guinea — Piracy Hot Zone", lat: 4.00, lng: 3.00, area: "Gulf of Guinea", type: "piracy", issued: new Date().toISOString() },
  { id: "nav-suez", title: "Suez Canal — Restricted Navigation", lat: 30.45, lng: 32.35, area: "Suez Canal", type: "traffic", issued: new Date().toISOString() },
  { id: "nav-panama", title: "Panama Canal — Draft Restrictions", lat: 9.08, lng: -79.68, area: "Panama Canal", type: "navigation", issued: new Date().toISOString() },
  { id: "nav-scs", title: "South China Sea — Territorial Dispute Zone", lat: 12.00, lng: 114.00, area: "South China Sea", type: "military", issued: new Date().toISOString() },
  { id: "nav-somalia", title: "Somali Coast — Anti-Piracy Patrol Zone", lat: 5.00, lng: 49.00, area: "Somali Basin", type: "piracy", issued: new Date().toISOString() },
  { id: "nav-arctic", title: "Northern Sea Route — Ice Navigation", lat: 72.00, lng: 130.00, area: "Arctic / NSR", type: "ice", issued: new Date().toISOString() },
  { id: "nav-bosporus", title: "Turkish Straits — Dense Traffic", lat: 41.12, lng: 29.05, area: "Bosphorus", type: "traffic", issued: new Date().toISOString() },
  { id: "nav-dover", title: "Strait of Dover — Heavy Traffic Separation", lat: 51.00, lng: 1.50, area: "English Channel", type: "traffic", issued: new Date().toISOString() },
  { id: "nav-gibraltar", title: "Strait of Gibraltar — Cross Traffic", lat: 35.96, lng: -5.50, area: "Gibraltar", type: "traffic", issued: new Date().toISOString() },
  { id: "nav-persian", title: "Persian Gulf — Oil Terminal Operations", lat: 27.50, lng: 50.50, area: "Persian Gulf", type: "operations", issued: new Date().toISOString() },
  { id: "nav-mozambique", title: "Mozambique Channel — Cyclone Season Route", lat: -16.00, lng: 41.00, area: "Mozambique Channel", type: "weather", issued: new Date().toISOString() },
  { id: "nav-drake", title: "Drake Passage — Severe Weather Warnings", lat: -60.00, lng: -65.00, area: "Drake Passage", type: "weather", issued: new Date().toISOString() },
  { id: "nav-kerch", title: "Kerch Strait — Access Restrictions", lat: 45.30, lng: 36.60, area: "Kerch Strait", type: "military", issued: new Date().toISOString() },
  { id: "nav-singapore", title: "Singapore Strait — Dense Vessel Traffic", lat: 1.25, lng: 103.85, area: "Singapore Strait", type: "traffic", issued: new Date().toISOString() },
];

interface MSISFeature {
  properties: {
    msgYear: number;
    msgNumber: number;
    navArea: string;
    subregion: string;
    text: string;
    status: string;
    issueDate: string;
    authority: string;
  };
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  } | null;
}

interface MSISResponse {
  type: "FeatureCollection";
  features: MSISFeature[];
}

export async function fetchNavWarnings(): Promise<NavWarning[]> {
  return cachedFetch<NavWarning[]>(
    "nav-warnings",
    async () => {
      try {
        // Try NGA MSIS API
        const res = await fetch(
          "https://msi.gs.mil/api/publications/broadcast-warn?status=active&output=json",
          {
            signal: AbortSignal.timeout(10000),
            headers: { Accept: "application/json" },
          }
        );

        if (!res.ok) return MAJOR_WARNING_AREAS;

        const json: MSISResponse = await res.json();
        if (!json.features || json.features.length === 0) return MAJOR_WARNING_AREAS;

        const warnings: NavWarning[] = [];

        for (const feature of json.features) {
          const props = feature.properties;
          let lat: number | null = null;
          let lng: number | null = null;

          if (feature.geometry?.coordinates) {
            const coords = feature.geometry.coordinates;
            if (feature.geometry.type === "Point" && typeof coords[0] === "number") {
              lng = coords[0] as number;
              lat = coords[1] as number;
            }
          }

          if (lat === null || lng === null) continue;

          warnings.push({
            id: `nga-${props.navArea}-${props.msgYear}-${props.msgNumber}`,
            title: (props.text || "").slice(0, 200),
            lat,
            lng,
            area: `${props.navArea} ${props.subregion || ""}`.trim(),
            type: "navigational",
            issued: props.issueDate || new Date().toISOString(),
          });

          if (warnings.length >= 50) break;
        }

        return warnings.length > 0 ? warnings : MAJOR_WARNING_AREAS;
      } catch {
        return MAJOR_WARNING_AREAS;
      }
    },
    TTL.STATIC // 1 hour — navigational warnings change slowly
  );
}
