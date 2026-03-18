/**
 * DolarAPI — Latin American currency exchange rates.
 * No API key required.
 * https://dolarapi.com/
 */

export interface DolarQuote {
  moneda: string; // currency code
  casa: string; // exchange type
  nombre: string; // display name
  compra: number | null; // buy price
  venta: number | null; // sell price
  fechaActualizacion: string;
}

export interface DolarApiResponse {
  quotes: DolarQuote[];
  updatedAt: string;
}

/** Fetch all dollar exchange rates from DolarAPI (ARS-focused) */
export async function fetchDolarRates(): Promise<DolarApiResponse | null> {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return {
      quotes: data.map((d: Record<string, unknown>): DolarQuote => ({
        moneda: String(d.moneda || "USD"),
        casa: String(d.casa || ""),
        nombre: String(d.nombre || ""),
        compra: d.compra != null ? Number(d.compra) : null,
        venta: d.venta != null ? Number(d.venta) : null,
        fechaActualizacion: String(d.fechaActualizacion || new Date().toISOString()),
      })),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Fetch other Latin American currencies vs USD */
export async function fetchLatamCurrencies(): Promise<DolarQuote[]> {
  try {
    const res = await fetch("https://dolarapi.com/v1/cotizaciones", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((d: Record<string, unknown>): DolarQuote => ({
      moneda: String(d.moneda || ""),
      casa: String(d.casa || ""),
      nombre: String(d.nombre || ""),
      compra: d.compra != null ? Number(d.compra) : null,
      venta: d.venta != null ? Number(d.venta) : null,
      fechaActualizacion: String(d.fechaActualizacion || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}
