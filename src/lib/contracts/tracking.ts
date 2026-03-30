import { z } from "zod";

export const AircraftCategorySchema = z.enum([
  "military", "cargo", "commercial", "helicopter", "light", "unknown",
]);

export const AircraftStateSchema = z.object({
  icao24: z.string(),
  callsign: z.string().nullable(),
  originCountry: z.string(),
  longitude: z.number().nullable(),
  latitude: z.number().nullable(),
  altitude: z.number().nullable(),
  velocity: z.number().nullable(),
  heading: z.number().nullable(),
  verticalRate: z.number().nullable(),
  onGround: z.boolean(),
  squawk: z.string().nullable(),
  lastContact: z.number(),
  category: AircraftCategorySchema,
});

export const VesselTypeSchema = z.enum([
  "cargo", "tanker", "passenger", "military", "fishing", "tug", "unknown",
]);

export const VesselPositionSchema = z.object({
  mmsi: z.string(),
  name: z.string(),
  shipType: VesselTypeSchema,
  latitude: z.number(),
  longitude: z.number(),
  course: z.number().nullable(),
  speed: z.number().nullable(),
  heading: z.number().nullable(),
  destination: z.string().nullable(),
  flag: z.string().nullable(),
  lastUpdate: z.string(),
});

export type AircraftCategory = z.infer<typeof AircraftCategorySchema>;
export type AircraftState = z.infer<typeof AircraftStateSchema>;
export type VesselType = z.infer<typeof VesselTypeSchema>;
export type VesselPosition = z.infer<typeof VesselPositionSchema>;
