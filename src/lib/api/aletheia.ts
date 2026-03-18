/**
 * Aletheia — Insider trading data, earnings, financials
 */
import type { IntelItem } from "@/types/intel";

export async function fetchInsiderTrading(): Promise<IntelItem[]> {
  const apiKey = process.env.ALETHEIA_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.aletheiaapi.com/InsiderTrading?top=15`,
      { signal: AbortSignal.timeout(10000), headers: { key: apiKey } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).slice(0, 15).map((t: Record<string, unknown>, i: number): IntelItem => ({
      id: `aletheia-${i}-${Date.now()}`,
      title: `Insider Trade: ${t.OwnerName || "Unknown"} ${t.TransactionType || ""} ${t.Issuer || ""}`,
      summary: `Shares: ${t.SharesTraded || "?"} | Value: $${Number(t.MoneyValue || 0).toLocaleString()}`,
      url: String(t.SecFilingUrl || "https://www.sec.gov/cgi-bin/browse-edgar"),
      source: "Aletheia/SEC",
      category: "finance",
      severity: Number(t.MoneyValue || 0) > 1000000 ? "high" : "medium",
      publishedAt: String(t.FiledDate || new Date().toISOString()),
    }));
  } catch { return []; }
}
