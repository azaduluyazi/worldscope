/**
 * Frankfurter — ECB exchange rates, no key required.
 * https://www.frankfurter.app/docs
 */

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const BASE = "https://api.frankfurter.app";

/** Fetch latest ECB exchange rates */
export async function fetchECBRates(base = "USD"): Promise<ExchangeRates | null> {
  try {
    const res = await fetch(`${BASE}/latest?base=${base}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fetch historical rates for time series */
export async function fetchRateTimeSeries(
  base = "USD",
  target = "EUR",
  days = 30
): Promise<Record<string, Record<string, number>> | null> {
  try {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    const res = await fetch(`${BASE}/${start}..${end}?base=${base}&symbols=${target}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.rates || null;
  } catch {
    return null;
  }
}
