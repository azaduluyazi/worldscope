/**
 * Finance Geo Points — extracts layer-specific subsets from finance-geo.ts.
 * Used by "promoted" layers (central-banks, commodity-hubs, financial-centers)
 * to render as toggleable map layers instead of a fixed overlay.
 */

import {
  STOCK_EXCHANGES,
  FINANCIAL_CENTERS,
  CENTRAL_BANKS,
  COMMODITY_HUBS,
  type FinanceGeoPoint,
} from "@/config/finance-geo";

export interface FinanceLayerPoint {
  lat: number;
  lng: number;
  name: string;
  shortName: string;
  city: string;
  country: string;
  tier: string;
  detail?: string;
}

function toLayerPoints(points: FinanceGeoPoint[]): FinanceLayerPoint[] {
  return points.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    name: p.name,
    shortName: p.shortName,
    city: p.city,
    country: p.country,
    tier: p.tier,
    detail: p.detail,
  }));
}

/** Stock exchanges — 30 points */
export function getStockExchangePoints(): FinanceLayerPoint[] {
  return toLayerPoints(STOCK_EXCHANGES);
}

/** Financial centers — 12 points (GFCI ranked) */
export function getFinancialCenterPoints(): FinanceLayerPoint[] {
  return toLayerPoints(FINANCIAL_CENTERS);
}

/** Central banks — 14 points (Fed, ECB, BoJ, etc.) */
export function getCentralBankPoints(): FinanceLayerPoint[] {
  return toLayerPoints(CENTRAL_BANKS);
}

/** Commodity hubs — 9 points (CME, ICE, LME, etc.) */
export function getCommodityHubPoints(): FinanceLayerPoint[] {
  return toLayerPoints(COMMODITY_HUBS);
}
