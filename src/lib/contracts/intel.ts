import { z } from "zod";

export const SeveritySchema = z.enum(["critical", "high", "medium", "low", "info"]);

export const CategorySchema = z.enum([
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health", "sports",
]);

export const IntelItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  url: z.string(),
  source: z.string(),
  category: CategorySchema,
  severity: SeveritySchema,
  publishedAt: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  countryCode: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const IntelFeedResponseSchema = z.object({
  items: z.array(IntelItemSchema),
  lastUpdated: z.string(),
  total: z.number(),
});

export type Severity = z.infer<typeof SeveritySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type IntelItem = z.infer<typeof IntelItemSchema>;
export type IntelFeedResponse = z.infer<typeof IntelFeedResponseSchema>;
