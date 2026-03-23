/**
 * Electricity Maps — Global real-time electricity CO2 intensity.
 * Covers ~80 countries with live carbon intensity, power breakdown, and generation sources.
 * Free tier: https://app.electricitymaps.com/ (public data)
 * Docs: https://docs.electricitymaps.com/
 *
 * Source: electricitymaps/electricitymaps-contrib (3961 stars)
 * Gap filled: Global CO2 intensity — entsoe covers EU prices, eia covers US volumes,
 * uk-carbon covers UK only. This provides worldwide coverage.
 */

import type { IntelItem, Severity } from "@/types/intel";

const EMAPS_API = "https://api.electricitymap.org/v3";

interface ZoneOverview {
  zone: string;
  carbonIntensity: number; // gCO2eq/kWh
  fossilFuelPercentage: number;
  renewablePercentage: number;
  powerConsumptionTotal: number; // MW
  powerProductionTotal: number; // MW
  datetime: string;
}

function co2ToSeverity(co2: number): Severity {
  if (co2 > 600) return "high";    // Very dirty grid (coal-heavy)
  if (co2 > 400) return "medium";  // Moderate
  if (co2 > 200) return "low";     // Cleaner
  return "info";                    // Very clean (hydro/nuclear/wind)
}

/** Major zones to monitor */
const MONITORED_ZONES = [
  { zone: "DE", name: "Germany" },
  { zone: "FR", name: "France" },
  { zone: "GB", name: "United Kingdom" },
  { zone: "US-CAL-CISO", name: "California" },
  { zone: "US-NY-NYIS", name: "New York" },
  { zone: "IN-NO", name: "India (North)" },
  { zone: "CN-SH", name: "China (Shanghai)" },
  { zone: "JP-TK", name: "Japan (Tokyo)" },
  { zone: "BR-S", name: "Brazil (South)" },
  { zone: "AU-NSW", name: "Australia (NSW)" },
  { zone: "TR", name: "Turkey" },
  { zone: "PL", name: "Poland" },
];

/**
 * Fetch carbon intensity for a specific zone.
 */
export async function fetchZoneCarbonIntensity(zone: string): Promise<ZoneOverview | null> {
  const apiKey = process.env.ELECTRICITYMAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${EMAPS_API}/carbon-intensity/latest?zone=${zone}`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "auth-token": apiKey,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      zone,
      carbonIntensity: data.carbonIntensity || 0,
      fossilFuelPercentage: data.fossilFuelPercentage || 0,
      renewablePercentage: data.renewablePercentage || 0,
      powerConsumptionTotal: data.powerConsumptionTotal || 0,
      powerProductionTotal: data.powerProductionTotal || 0,
      datetime: data.datetime || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch global electricity intel — highlights dirty grids and anomalies.
 */
export async function fetchElectricityMapsIntel(): Promise<IntelItem[]> {
  const apiKey = process.env.ELECTRICITYMAPS_API_KEY;
  if (!apiKey) return [];

  const items: IntelItem[] = [];

  for (const { zone, name } of MONITORED_ZONES.slice(0, 6)) {
    try {
      const data = await fetchZoneCarbonIntensity(zone);
      if (!data) continue;

      const co2 = data.carbonIntensity;
      const renewable = data.renewablePercentage;
      const icon = co2 > 400 ? "🟤" : co2 > 200 ? "🟡" : "🟢";

      items.push({
        id: `emaps-${zone}-${Date.now()}`,
        title: `${icon} ${name}: ${co2}g CO₂/kWh`,
        summary: `Carbon intensity: ${co2}g CO₂eq/kWh | Renewable: ${renewable.toFixed(0)}% | Production: ${data.powerProductionTotal.toFixed(0)}MW`,
        url: `https://app.electricitymaps.com/zone/${zone}`,
        source: "Electricity Maps",
        category: "energy",
        severity: co2ToSeverity(co2),
        publishedAt: data.datetime,
        countryCode: zone.slice(0, 2),
      });
    } catch {
      continue;
    }
  }

  return items;
}
