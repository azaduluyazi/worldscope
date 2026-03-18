/**
 * National Grid ESO — UK electricity generation & demand data.
 * Uses CKAN datastore API. No key required.
 * https://data.nationalgrideso.com/
 *
 * NOTE: The actual resource_id needs to be discovered from the National Grid
 * ESO data portal. Use their dataset search to find current resource IDs.
 */

export interface NationalGridRecord {
  _id: number;
  settlementDate: string;
  settlementPeriod: number;
  demand: number; // MW
  generation: number; // MW
  windGeneration?: number;
  solarGeneration?: number;
  frequency?: number; // Hz
}

export interface NationalGridResponse {
  records: NationalGridRecord[];
  total: number;
  updatedAt: string;
}

const NGESO_API = "https://data.nationalgrideso.com/api/3/action/datastore_search";

/**
 * Fetch UK electricity data from National Grid ESO.
 * @param resourceId - CKAN resource ID (must be discovered from the data portal)
 * @param limit - Number of records to fetch
 */
export async function fetchNationalGridData(
  resourceId: string,
  limit = 48,
): Promise<NationalGridResponse | null> {
  if (!resourceId) return null;

  try {
    const params = new URLSearchParams({
      resource_id: resourceId,
      limit: String(limit),
      sort: "_id desc",
    });
    const res = await fetch(`${NGESO_API}?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.result;
    if (!result?.records) return null;

    return {
      records: result.records.map((r: Record<string, unknown>) => ({
        _id: Number(r._id || 0),
        settlementDate: String(r.SETTLEMENT_DATE || r.settlementDate || ""),
        settlementPeriod: Number(r.SETTLEMENT_PERIOD || r.settlementPeriod || 0),
        demand: Number(r.ND || r.demand || 0),
        generation: Number(r.GENERATION || r.generation || 0),
        windGeneration: r.WIND ? Number(r.WIND) : undefined,
        solarGeneration: r.SOLAR ? Number(r.SOLAR) : undefined,
        frequency: r.FREQUENCY ? Number(r.FREQUENCY) : undefined,
      })),
      total: result.total || 0,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
