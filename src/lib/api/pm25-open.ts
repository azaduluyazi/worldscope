/**
 * Open PM2.5 Sensors — Global air quality from open sensor networks.
 * Uses the Sensor.Community (formerly Luftdaten) API. No key required.
 * https://sensor.community/
 */
import type { IntelItem } from "@/types/intel";

interface SensorReading {
  id: number;
  sensor: { id: number; sensor_type: { name: string } };
  location: { latitude: string; longitude: string; country: string };
  sensordatavalues: Array<{ value_type: string; value: string }>;
  timestamp: string;
}

const SENSOR_COMMUNITY_API = "https://data.sensor.community/airrohr/v1/filter/type=SDS011";

/**
 * Fetch PM2.5 readings above threshold from open sensor network.
 * Returns high readings as IntelItems for monitoring.
 */
export async function fetchPm25Alerts(
  threshold = 100,
): Promise<IntelItem[]> {
  try {
    const res = await fetch(SENSOR_COMMUNITY_API, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "WorldScope/1.0" },
    });
    if (!res.ok) return [];

    const data: SensorReading[] = await res.json();
    if (!Array.isArray(data)) return [];

    const items: IntelItem[] = [];

    for (const reading of data) {
      const pm25Value = reading.sensordatavalues?.find(
        (v) => v.value_type === "P2",
      );
      if (!pm25Value) continue;

      const value = parseFloat(pm25Value.value);
      if (isNaN(value) || value < threshold) continue;

      const lat = parseFloat(reading.location.latitude);
      const lng = parseFloat(reading.location.longitude);

      items.push({
        id: `pm25-${reading.id}`,
        title: `High PM2.5: ${value.toFixed(1)} µg/m³`,
        summary: `Sensor #${reading.sensor.id} (${reading.sensor.sensor_type.name}) in ${reading.location.country || "Unknown"} — exceeds safe threshold`,
        url: "https://sensor.community/en/",
        source: "Sensor.Community",
        category: "health",
        severity: value > 300 ? "critical" : value > 200 ? "high" : "medium",
        publishedAt: reading.timestamp,
        lat: isNaN(lat) ? undefined : lat,
        lng: isNaN(lng) ? undefined : lng,
        countryCode: reading.location.country || undefined,
      });

      if (items.length >= 15) break;
    }

    return items;
  } catch {
    return [];
  }
}
