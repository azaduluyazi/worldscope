/**
 * Humanitarian Data Exchange (HDX) — OCHA crisis data packages.
 * No API key required. Uses CKAN action API.
 * https://data.humdata.org/
 */
import type { IntelItem } from "@/types/intel";

const HDX_API = "https://data.humdata.org/api/3/action/package_search";

interface HdxPackage {
  id: string;
  title: string;
  notes: string;
  url: string;
  metadata_created: string;
  metadata_modified: string;
  organization?: { title: string };
  tags?: Array<{ name: string }>;
}

/** Fetch recent humanitarian crisis datasets from HDX */
export async function fetchHumanitarianData(
  query = "crisis",
  rows = 15,
): Promise<IntelItem[]> {
  try {
    const params = new URLSearchParams({ q: query, rows: String(rows), sort: "metadata_modified desc" });
    const res = await fetch(`${HDX_API}?${params}`, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "WorldScope/1.0" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const packages: HdxPackage[] = data?.result?.results || [];

    return packages.map((pkg) => {
      const tags = (pkg.tags || []).map((t) => t.name).join(", ");
      const textLower = `${pkg.title} ${pkg.notes || ""} ${tags}`.toLowerCase();
      const isCritical =
        /famine|emergency|crisis|conflict/.test(textLower);
      const isHigh =
        /refugee|displacement|cholera|flood|drought/.test(textLower);

      return {
        id: `hdx-${pkg.id.slice(0, 20)}`,
        title: pkg.title,
        summary: (pkg.notes || "").slice(0, 300),
        url: `https://data.humdata.org/dataset/${pkg.id}`,
        source: pkg.organization?.title || "HDX",
        category: "health" as const,
        severity: isCritical ? "critical" : isHigh ? "high" : "medium",
        publishedAt: pkg.metadata_modified || pkg.metadata_created,
      };
    });
  } catch {
    return [];
  }
}
