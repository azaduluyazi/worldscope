/**
 * Hong Kong Observatory — Weather warnings and alerts. No key required.
 * https://data.weather.gov.hk/
 */
import type { IntelItem } from "@/types/intel";

const HKO_API =
  "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";

interface HkoWarning {
  warningStatementCode: string;
  subtype?: string;
  contents?: string[];
  updateTime?: string;
  actionCode?: string;
}

interface HkoWarnSummary {
  [key: string]: HkoWarning;
}

const SEVERITY_MAP: Record<string, "critical" | "high" | "medium"> = {
  WTCSGNL: "critical", // Tropical cyclone
  WRAIN: "high", // Rainstorm
  WFROST: "medium",
  WHOT: "medium",
  WCOLD: "medium",
  WMSGNL: "high", // Monsoon
  WFNTSA: "high", // Tsunami
  WFIRE: "high",
  WLANDSLIP: "high",
  WTMW: "critical", // Tsunami warning
};

/** Fetch active weather warnings from Hong Kong Observatory */
export async function fetchHkObservatoryWarnings(): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      `${HKO_API}?dataType=warnsum&lang=en`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];

    const data: HkoWarnSummary = await res.json();
    if (!data || typeof data !== "object") return [];

    const items: IntelItem[] = [];
    for (const [code, warning] of Object.entries(data)) {
      if (!warning || !warning.warningStatementCode) continue;

      const contents = (warning.contents || []).join(" ").slice(0, 300);
      items.push({
        id: `hko-${code}-${Date.now()}`,
        title: `Hong Kong Weather Warning: ${warning.warningStatementCode}${warning.subtype ? ` (${warning.subtype})` : ""}`,
        summary: contents || `Active warning: ${code}`,
        url: "https://www.hko.gov.hk/en/wxinfo/warning/warn.htm",
        source: "HK Observatory",
        category: "natural",
        severity: SEVERITY_MAP[code] || "medium",
        publishedAt: warning.updateTime || new Date().toISOString(),
        lat: 22.3193,
        lng: 114.1694,
        countryCode: "HK",
      });
    }

    return items;
  } catch {
    return [];
  }
}
