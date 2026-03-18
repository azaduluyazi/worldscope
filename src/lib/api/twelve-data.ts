/**
 * Twelve Data — Real-time & historical stock data
 * https://twelvedata.com/
 */

export async function fetchTwelveDataQuote(symbol = "SPY"): Promise<{ price: number; change: number; percent: number } | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      price: parseFloat(data.close) || 0,
      change: parseFloat(data.change) || 0,
      percent: parseFloat(data.percent_change) || 0,
    };
  } catch { return null; }
}
