export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  updatedAt: string;
}

export interface MarketDataResponse {
  quotes: MarketQuote[];
  lastUpdated: string;
}

export type MarketDirection = "up" | "down" | "neutral";

export function getDirection(changePct: number): MarketDirection {
  if (changePct > 0.01) return "up";
  if (changePct < -0.01) return "down";
  return "neutral";
}
