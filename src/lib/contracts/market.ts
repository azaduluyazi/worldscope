import { z } from "zod";

export const MarketQuoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number().optional(),
  changePct: z.number().optional(),
  changePercent: z.number().optional(),
  volume: z.number().optional(),
  marketCap: z.number().optional(),
  currency: z.string().optional(),
  source: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const FearGreedSchema = z.object({
  value: z.number().min(0).max(100),
  label: z.string(),
  previousClose: z.number().optional(),
  timestamp: z.string().optional(),
});

export const MarketResponseSchema = z.object({
  quotes: z.array(MarketQuoteSchema),
  fearGreed: FearGreedSchema.optional(),
  crypto: z.array(MarketQuoteSchema).optional(),
  lastUpdated: z.string().optional(),
  fromSeed: z.boolean().optional(),
  cachedAt: z.string().optional(),
});

export const MarketDirectionSchema = z.enum(["up", "down", "neutral"]);

export type MarketQuote = z.infer<typeof MarketQuoteSchema>;
export type FearGreed = z.infer<typeof FearGreedSchema>;
export type MarketResponse = z.infer<typeof MarketResponseSchema>;
export type MarketDirection = z.infer<typeof MarketDirectionSchema>;
