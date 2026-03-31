import { z } from "zod";

export const intelQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(2000).default(100),
  hours: z.coerce.number().min(1).max(720).default(24),
  lang: z.string().min(2).max(5).default("en"),
  category: z.string().optional(),
  severity: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  country: z.string().max(2).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
