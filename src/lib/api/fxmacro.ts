/**
 * FXMacroData — Central bank macro data for forex
 */

export async function fetchFXMacroData(): Promise<Array<{ pair: string; rate: number; change: number }>> {
  const apiKey = process.env.FXMACRO_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.fxmacrodata.com/v1/latest?api_key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Object.entries(data?.rates || {}).slice(0, 20).map(([pair, rate]) => ({
      pair,
      rate: Number(rate),
      change: 0,
    }));
  } catch { return []; }
}
