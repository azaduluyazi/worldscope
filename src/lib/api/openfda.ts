/**
 * OpenFDA — Food & Drug Enforcement (Recalls).
 * Source: https://api.fda.gov/food/enforcement.json + drug/enforcement.json
 * No API key required (rate limited to 240 req/min without key).
 */

import type { IntelItem } from "@/types/intel";

interface FdaEnforcement {
  recall_number?: string;
  product_description?: string;
  reason_for_recall?: string;
  classification?: string;
  recalling_firm?: string;
  report_date?: string;
  product_type?: string;
  status?: string;
}

interface FdaResponse {
  results: FdaEnforcement[];
}

function classificationToSeverity(cls?: string) {
  if (!cls) return "medium" as const;
  if (cls.includes("I")) return "critical" as const;
  if (cls.includes("II")) return "high" as const;
  return "medium" as const;
}

async function fetchCategory(type: "food" | "drug"): Promise<IntelItem[]> {
  const url = `https://api.fda.gov/${type}/enforcement.json?limit=10&sort=report_date:desc`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data: FdaResponse = await res.json();

  return (data.results || []).map((item, idx) => {
    const description = (item.product_description || "Unknown product").slice(0, 100);
    const firm = item.recalling_firm || "Unknown firm";

    return {
      id: `openfda-${type}-${item.recall_number || idx}-${idx}`,
      title: `FDA Recall (${type}): ${description}`,
      summary: `Firm: ${firm} | Reason: ${(item.reason_for_recall || "N/A").slice(0, 200)} | Class: ${item.classification || "N/A"}`,
      url: `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts`,
      source: "OpenFDA",
      category: "health" as const,
      severity: classificationToSeverity(item.classification),
      publishedAt: item.report_date
        ? new Date(item.report_date).toISOString()
        : new Date().toISOString(),
    };
  });
}

export async function fetchOpenFda(): Promise<IntelItem[]> {
  try {
    const [foodItems, drugItems] = await Promise.allSettled([
      fetchCategory("food"),
      fetchCategory("drug"),
    ]);

    return [
      ...(foodItems.status === "fulfilled" ? foodItems.value : []),
      ...(drugItems.status === "fulfilled" ? drugItems.value : []),
    ];
  } catch {
    return [];
  }
}
