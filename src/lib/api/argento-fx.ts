/**
 * Argentine Exchange Rates — Blue dollar and official rates.
 * Uses public APIs for ARS exchange data. No key required.
 * Source: https://criptoya.com/api
 */

export interface ExchangeRate {
  name: string;
  buy: number;
  sell: number;
  spread: number;
  updatedAt: string;
}

export interface ArgentinaFxResponse {
  rates: ExchangeRate[];
  updatedAt: string;
}

const DOLAR_API = "https://dolarapi.com/v1/dolares";

/** Fetch Argentine exchange rates (official, blue, MEP, CCL, etc.) */
export async function fetchArgentinaFx(): Promise<ArgentinaFxResponse | null> {
  try {
    const res = await fetch(DOLAR_API, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const rates: ExchangeRate[] = data.map(
      (d: Record<string, unknown>) => {
        const buy = Number(d.compra || 0);
        const sell = Number(d.venta || 0);
        return {
          name: String(d.nombre || d.casa || "Unknown"),
          buy,
          sell,
          spread: sell > 0 && buy > 0 ? ((sell - buy) / buy) * 100 : 0,
          updatedAt: String(d.fechaActualizacion || new Date().toISOString()),
        };
      },
    );

    return {
      rates,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
