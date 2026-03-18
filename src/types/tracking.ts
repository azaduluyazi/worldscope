/** ADS-B Aircraft state from OpenSky Network */
export interface AircraftState {
  icao24: string;           // ICAO 24-bit address (hex)
  callsign: string | null;  // Callsign (8 chars max)
  originCountry: string;
  longitude: number | null;
  latitude: number | null;
  altitude: number | null;   // Barometric altitude (meters)
  velocity: number | null;   // Ground speed (m/s)
  heading: number | null;    // True track (degrees clockwise from north)
  verticalRate: number | null;
  onGround: boolean;
  squawk: string | null;     // Transponder code
  lastContact: number;       // Unix timestamp
  category: AircraftCategory;
}

export type AircraftCategory =
  | "military"
  | "cargo"
  | "commercial"
  | "helicopter"
  | "light"
  | "unknown";

/** Maritime vessel position */
export interface VesselPosition {
  mmsi: string;              // Maritime Mobile Service Identity
  name: string;
  shipType: VesselType;
  latitude: number;
  longitude: number;
  course: number | null;     // Course over ground (degrees)
  speed: number | null;      // Speed over ground (knots)
  heading: number | null;
  destination: string | null;
  flag: string | null;       // ISO country code
  lastUpdate: string;        // ISO timestamp
}

export type VesselType =
  | "cargo"
  | "tanker"
  | "passenger"
  | "military"
  | "fishing"
  | "tug"
  | "unknown";

/** Power outage data */
export interface PowerOutage {
  state: string;
  county: string;
  utility: string;
  customersTracked: number;
  customersOut: number;
  outagePercentage: number;
  lastUpdate: string;
}

/** Prediction market */
export interface PredictionMarket {
  id: string;
  question: string;
  category: string;
  probability: number;       // 0-1
  volume: number;
  endDate: string | null;
  source: "polymarket" | "predictit" | "metaculus";
  url: string;
}

/** Government fiscal data */
export interface FiscalData {
  category: string;
  amount: number;
  period: string;
  source: string;
  description: string;
}
