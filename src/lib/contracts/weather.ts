import { z } from "zod";

export const WeatherCitySchema = z.object({
  lat: z.number(),
  lng: z.number(),
  city: z.string(),
  country: z.string(),
  temperature: z.number(),
  windSpeed: z.number(),
  weatherCode: z.number(),
  weatherLabel: z.string(),
  isExtreme: z.boolean(),
});

export const WeatherAlertSchema = z.object({
  id: z.string().optional(),
  event: z.string(),
  headline: z.string().optional(),
  description: z.string().optional(),
  severity: z.enum(["Extreme", "Severe", "Moderate", "Minor", "Unknown"]).optional(),
  urgency: z.string().optional(),
  area: z.string().optional(),
  onset: z.string().optional(),
  expires: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
});

export const WeatherResponseSchema = z.object({
  cities: z.array(WeatherCitySchema),
  total: z.number(),
  lastUpdated: z.string(),
});

export type WeatherCity = z.infer<typeof WeatherCitySchema>;
export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;
export type WeatherResponse = z.infer<typeof WeatherResponseSchema>;
