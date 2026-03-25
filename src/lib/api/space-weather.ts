/**
 * 7Timer — Space/Astronomical Weather Conditions.
 * Source: https://www.7timer.info/bin/astro.php
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface SevenTimerDatapoint {
  timepoint: number;
  cloudcover: number;
  seeing: number;
  transparency: number;
  wind10m?: { direction: string; speed: number };
  temp2m: number;
}

interface SevenTimerResponse {
  product: string;
  init: string;
  dataseries: SevenTimerDatapoint[];
}

const CLOUD_LABELS = ["0-6%", "6-19%", "19-31%", "31-44%", "44-56%", "56-69%", "69-81%", "81-94%", "94-100%"];
const SEEING_LABELS = ["<0.5\"", "0.5-0.75\"", "0.75-1\"", "1-1.25\"", "1.25-1.5\"", "1.5-2\"", "2-2.5\"", ">2.5\""];
const TRANSPARENCY_LABELS = ["<0.3", "0.3-0.4", "0.4-0.5", "0.5-0.6", "0.6-0.7", "0.7-0.85", "0.85-1", ">1"];

export async function fetchSpaceWeather(): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      "https://www.7timer.info/bin/astro.php?lon=0&lat=51&ac=0&unit=metric&output=json&tzshift=0",
      { signal: AbortSignal.timeout(10000), next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data: SevenTimerResponse = await res.json();
    const series = data.dataseries || [];
    if (series.length === 0) return [];

    const current = series[0];
    const cloudIdx = Math.min(current.cloudcover - 1, CLOUD_LABELS.length - 1);
    const seeingIdx = Math.min(current.seeing - 1, SEEING_LABELS.length - 1);
    const transIdx = Math.min(current.transparency - 1, TRANSPARENCY_LABELS.length - 1);

    const cloudLabel = CLOUD_LABELS[Math.max(cloudIdx, 0)] ?? "unknown";
    const seeingLabel = SEEING_LABELS[Math.max(seeingIdx, 0)] ?? "unknown";
    const transLabel = TRANSPARENCY_LABELS[Math.max(transIdx, 0)] ?? "unknown";

    const severity = current.cloudcover >= 7 ? "high" : current.cloudcover >= 5 ? "medium" : "low";
    const conditions = current.cloudcover >= 7 ? "Overcast" : current.cloudcover >= 5 ? "Partly Cloudy" : "Clear";

    return [
      {
        id: `space-weather-${data.init}-0`,
        title: `Space Weather: ${conditions} (London/0°)`,
        summary: `Cloud cover: ${cloudLabel} | Seeing: ${seeingLabel} | Transparency: ${transLabel} | Temp: ${current.temp2m}°C`,
        url: "https://www.7timer.info",
        source: "7Timer",
        category: "natural" as const,
        severity,
        publishedAt: new Date().toISOString(),
      },
    ];
  } catch {
    return [];
  }
}
