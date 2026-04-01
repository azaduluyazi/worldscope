/**
 * NOAA SWPC — Space Weather Alerts (Solar Flares, Geomagnetic Storms)
 * Free, no API key required.
 * https://services.swpc.noaa.gov/products/alerts.json
 */

import { cachedFetch } from "@/lib/cache/redis";
import { TTL } from "@/lib/cache/redis";

export interface SolarAlert {
  id: string;
  type: string;
  message: string;
  issued: string;
  severity: string;
}

interface SWPCAlertEntry {
  product_id: string;
  issue_datetime: string;
  message: string;
}

function classifySolarAlert(message: string): { type: string; severity: string } {
  const upper = message.toUpperCase();

  // Solar flare classification
  if (upper.includes("X-CLASS") || upper.includes("XRAY FLUX EXCEEDED")) {
    return { type: "solar_flare", severity: "critical" };
  }
  if (upper.includes("M-CLASS") || upper.includes("M-FLARE")) {
    return { type: "solar_flare", severity: "high" };
  }

  // Geomagnetic storms
  if (upper.includes("GEOMAGNETIC") && (upper.includes("EXTREME") || upper.includes("G5") || upper.includes("G4"))) {
    return { type: "geomagnetic_storm", severity: "critical" };
  }
  if (upper.includes("GEOMAGNETIC") && (upper.includes("SEVERE") || upper.includes("G3"))) {
    return { type: "geomagnetic_storm", severity: "high" };
  }
  if (upper.includes("GEOMAGNETIC") && (upper.includes("MODERATE") || upper.includes("G2"))) {
    return { type: "geomagnetic_storm", severity: "medium" };
  }
  if (upper.includes("GEOMAGNETIC") || upper.includes("G1")) {
    return { type: "geomagnetic_storm", severity: "low" };
  }

  // Solar radiation storms
  if (upper.includes("SOLAR RADIATION") || upper.includes("PROTON")) {
    if (upper.includes("S4") || upper.includes("S5") || upper.includes("EXTREME")) {
      return { type: "solar_radiation", severity: "critical" };
    }
    if (upper.includes("S3") || upper.includes("STRONG")) {
      return { type: "solar_radiation", severity: "high" };
    }
    return { type: "solar_radiation", severity: "medium" };
  }

  // Radio blackouts
  if (upper.includes("RADIO BLACKOUT") || upper.includes("R3") || upper.includes("R4") || upper.includes("R5")) {
    return { type: "radio_blackout", severity: "high" };
  }

  // CME
  if (upper.includes("CORONAL MASS EJECTION") || upper.includes("CME")) {
    return { type: "cme", severity: "medium" };
  }

  // Warnings / watches
  if (upper.includes("WARNING")) {
    return { type: "space_weather_warning", severity: "medium" };
  }
  if (upper.includes("WATCH")) {
    return { type: "space_weather_watch", severity: "low" };
  }

  return { type: "space_weather", severity: "info" };
}

export async function fetchSolarAlerts(): Promise<SolarAlert[]> {
  return cachedFetch<SolarAlert[]>(
    "solar-alerts",
    async () => {
      try {
        const res = await fetch("https://services.swpc.noaa.gov/products/alerts.json", {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];

        const json: SWPCAlertEntry[] = await res.json();
        if (!Array.isArray(json)) return [];

        const alerts: SolarAlert[] = [];

        // Most recent alerts first (API returns newest last)
        const reversed = [...json].reverse();

        for (const entry of reversed) {
          const { type, severity } = classifySolarAlert(entry.message);

          alerts.push({
            id: entry.product_id || `solar-${alerts.length}-${Date.now()}`,
            type,
            message: entry.message.slice(0, 1000),
            issued: entry.issue_datetime || new Date().toISOString(),
            severity,
          });

          if (alerts.length >= 30) break;
        }

        return alerts;
      } catch {
        return [];
      }
    },
    TTL.MEDIUM // 5 min
  );
}
