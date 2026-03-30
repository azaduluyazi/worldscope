/**
 * IMF PortWatch — Maritime Chokepoint Trade Disruption Data
 * Free, no API key required.
 * https://portwatch.imf.org
 */

import { gatewayFetch } from "@/lib/api/gateway";

export interface PortWatchChokepoint {
  name: string;
  portId: string;
  status: string;
  tradeVolume: number;
  disruption: number;
  lat: number;
  lng: number;
  lastUpdated: string;
}

const PORTWATCH_BASE =
  "https://services.arcgis.com/ue9rwulIoeLEI9bj/arcgis/rest/services/IMF_PortWatch_Chokepoints/FeatureServer/0/query";

/** Fetch IMF PortWatch maritime chokepoint disruption data */
export async function fetchPortWatchChokepoints(): Promise<
  PortWatchChokepoint[]
> {
  return gatewayFetch(
    "imf-portwatch",
    async () => {
      const url = new URL(PORTWATCH_BASE);
      url.searchParams.set("where", "1=1");
      url.searchParams.set("outFields", "*");
      url.searchParams.set("f", "json");
      url.searchParams.set("resultRecordCount", "50");

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return [];

      const json = await res.json();
      const features: Array<Record<string, unknown>> =
        json?.features || [];

      return features.map((f) => {
        const attrs = (f.attributes || {}) as Record<string, unknown>;
        const geo = (f.geometry || {}) as Record<string, number>;
        return {
          name: (attrs.name as string) || (attrs.Name as string) || "",
          portId: String(attrs.port_id || attrs.PortId || ""),
          status: (attrs.status as string) || "unknown",
          tradeVolume: Number(attrs.trade_volume || attrs.TradeVolume || 0),
          disruption: Number(attrs.disruption_index || attrs.Disruption || 0),
          lat: geo.y || geo.latitude || 0,
          lng: geo.x || geo.longitude || 0,
          lastUpdated: attrs.last_updated
            ? new Date(attrs.last_updated as number).toISOString()
            : "",
        };
      });
    },
    { timeoutMs: 20000, fallback: [] }
  );
}
