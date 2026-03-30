import { z } from "zod";

export const ImfIndicatorSchema = z.object({
  country: z.string(),
  countryCode: z.string(),
  indicator: z.string(),
  value: z.number(),
  year: z.number(),
});

export const BigMacEntrySchema = z.object({
  countryCode: z.string(),
  countryName: z.string(),
  dollarPrice: z.number(),
  dollarAdj: z.number(),
});

export const BisPolicyRateSchema = z.object({
  country: z.string(),
  countryCode: z.string(),
  rate: z.number(),
});

export const EconomicsResponseSchema = z.object({
  gdp: z.array(ImfIndicatorSchema).optional(),
  inflation: z.array(ImfIndicatorSchema).optional(),
  bigmac: z.array(BigMacEntrySchema).optional(),
  policyRates: z.array(BisPolicyRateSchema).optional(),
  lastUpdated: z.string().optional(),
});

export type ImfIndicator = z.infer<typeof ImfIndicatorSchema>;
export type BigMacEntry = z.infer<typeof BigMacEntrySchema>;
export type BisPolicyRate = z.infer<typeof BisPolicyRateSchema>;
export type EconomicsResponse = z.infer<typeof EconomicsResponseSchema>;
