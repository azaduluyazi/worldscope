import { z } from "zod";
import { SeveritySchema, CategorySchema } from "./intel";

export const ThreatLevelSchema = z.enum(["critical", "high", "elevated", "guarded", "low"]);

export const ThreatIndexSchema = z.object({
  score: z.number().min(0).max(100),
  level: ThreatLevelSchema,
  categories: z.record(CategorySchema, z.number()).optional(),
  trends: z.object({
    rising: z.array(z.string()).optional(),
    falling: z.array(z.string()).optional(),
    hotspots: z.array(z.string()).optional(),
  }).optional().nullable(),
});

export const CyberThreatSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  source: z.string(),
  severity: SeveritySchema,
  type: z.string().optional(),
  indicator: z.string().optional(),
  publishedAt: z.string().optional(),
  url: z.string().optional(),
});

export type ThreatLevel = z.infer<typeof ThreatLevelSchema>;
export type ThreatIndex = z.infer<typeof ThreatIndexSchema>;
export type CyberThreat = z.infer<typeof CyberThreatSchema>;
