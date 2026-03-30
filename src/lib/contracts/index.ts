// Zod API contract schemas — single entry point
// Usage: import { IntelItemSchema, type IntelItem } from "@/lib/contracts";

export {
  MarketQuoteSchema,
  FearGreedSchema,
  MarketResponseSchema,
  MarketDirectionSchema,
  type MarketQuote,
  type FearGreed,
  type MarketResponse,
  type MarketDirection,
} from "./market";

export {
  SeveritySchema,
  CategorySchema,
  IntelItemSchema,
  IntelFeedResponseSchema,
  type Severity,
  type Category,
  type IntelItem,
  type IntelFeedResponse,
} from "./intel";

export {
  ThreatLevelSchema,
  ThreatIndexSchema,
  CyberThreatSchema,
  type ThreatLevel,
  type ThreatIndex,
  type CyberThreat,
} from "./threat";

export {
  WeatherCitySchema,
  WeatherAlertSchema,
  WeatherResponseSchema,
  type WeatherCity,
  type WeatherAlert,
  type WeatherResponse,
} from "./weather";

export {
  ImfIndicatorSchema,
  BigMacEntrySchema,
  BisPolicyRateSchema,
  EconomicsResponseSchema,
  type ImfIndicator,
  type BigMacEntry,
  type BisPolicyRate,
  type EconomicsResponse,
} from "./economic";

export {
  AircraftCategorySchema,
  AircraftStateSchema,
  VesselTypeSchema,
  VesselPositionSchema,
  type AircraftCategory,
  type AircraftState,
  type VesselType,
  type VesselPosition,
} from "./tracking";
