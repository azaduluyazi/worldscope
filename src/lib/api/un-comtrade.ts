/**
 * UN Comtrade — International trade flow data.
 * Free registration + subscription key required.
 * Docs: https://comtradedeveloper.un.org/
 */

export interface TradeFlow {
  reporterCode: string;
  reporterDesc: string;
  partnerCode: string;
  partnerDesc: string;
  tradeValue: number;
  period: number;
  flowDesc: string;
}

const COMTRADE_BASE = "https://comtradeapi.un.org/data/v1/get";

export async function fetchTradeFlows(
  reporterCode = "840",
  year?: number
): Promise<TradeFlow[]> {
  const key = process.env.UN_COMTRADE_KEY;
  if (!key) return [];

  const y = year || new Date().getFullYear() - 1;
  try {
    const res = await fetch(
      `${COMTRADE_BASE}/C/A/HS/${reporterCode}/TOTAL?cmdCode=TOTAL&period=${y}&subscription-key=${key}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data?.data || []).map((r: Record<string, unknown>) => ({
      reporterCode: String(r.reporterCode || ""),
      reporterDesc: String(r.reporterDesc || ""),
      partnerCode: String(r.partnerCode || ""),
      partnerDesc: String(r.partnerDesc || ""),
      tradeValue: Number(r.primaryValue || 0),
      period: Number(r.period || 0),
      flowDesc: String(r.flowDesc || ""),
    }));
  } catch {
    return [];
  }
}
