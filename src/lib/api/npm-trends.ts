/**
 * npm Downloads — Weekly Package Download Trends.
 * Source: https://api.npmjs.org/downloads/point/last-week/
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface NpmDownloadResponse {
  downloads: number;
  package: string;
  start: string;
  end: string;
}

const PACKAGES = ["react", "next", "vue", "svelte", "angular", "typescript"];

export async function fetchNpmTrends(): Promise<IntelItem[]> {
  try {
    const url = `https://api.npmjs.org/downloads/point/last-week/${PACKAGES.join(",")}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];

    // When multiple packages are requested, the API returns an object keyed by package name
    const data: Record<string, NpmDownloadResponse> = await res.json();

    return Object.values(data)
      .filter((pkg) => pkg && pkg.downloads)
      .sort((a, b) => b.downloads - a.downloads)
      .map((pkg, idx) => {
        const dl = pkg.downloads;
        const label =
          dl >= 1_000_000_000
            ? `${(dl / 1e9).toFixed(1)}B`
            : dl >= 1_000_000
            ? `${(dl / 1e6).toFixed(1)}M`
            : dl >= 1_000
            ? `${(dl / 1_000).toFixed(1)}K`
            : dl.toString();

        return {
          id: `npm-trends-${pkg.package}-${idx}`,
          title: `${pkg.package}: ${label} downloads/week`,
          summary: `npm weekly downloads (${pkg.start} to ${pkg.end}): ${dl.toLocaleString()}`,
          url: `https://www.npmjs.com/package/${pkg.package}`,
          source: "npm",
          category: "tech" as const,
          severity: "info" as const,
          publishedAt: pkg.end
            ? new Date(pkg.end).toISOString()
            : new Date().toISOString(),
        };
      });
  } catch {
    return [];
  }
}
