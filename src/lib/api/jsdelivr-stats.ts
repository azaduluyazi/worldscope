/**
 * jsDelivr — CDN Package Stats (top packages by hits).
 * Source: https://data.jsdelivr.com/v1/stats/packages
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface JsDelivrPackage {
  type: string;
  name: string;
  hits: { total: number; dates: Record<string, number> };
  bandwidth: { total: number };
}

export async function fetchJsDelivrStats(): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      "https://data.jsdelivr.com/v1/stats/packages?period=week&limit=10",
      { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data: JsDelivrPackage[] = await res.json();

    return (data || []).slice(0, 10).map((pkg, idx) => {
      const hits = pkg.hits?.total ?? 0;
      const label =
        hits >= 1_000_000_000
          ? `${(hits / 1e9).toFixed(1)}B`
          : hits >= 1_000_000
          ? `${(hits / 1e6).toFixed(1)}M`
          : `${(hits / 1_000).toFixed(1)}K`;

      return {
        id: `jsdelivr-${pkg.name?.replace(/\//g, "-")}-${idx}`,
        title: `${pkg.name}: ${label} hits/week`,
        summary: `jsDelivr CDN weekly hits: ${hits.toLocaleString()} | Type: ${pkg.type}`,
        url: `https://www.jsdelivr.com/package/${pkg.type}/${pkg.name}`,
        source: "jsDelivr",
        category: "tech" as const,
        severity: "info" as const,
        publishedAt: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
