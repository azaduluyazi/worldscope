import type { MapLayer } from "@/types/geo";
import type { VariantId } from "@/config/variants";

export const DEFAULT_LAYERS: MapLayer[] = [
  // ── Conflict & Security ──
  { id: "conflicts", label: "Conflicts", icon: "⚔️", color: "#ff4757", enabled: true, group: "conflict", description: "Active armed conflicts (ACLED)" },
  { id: "protests", label: "Protests", icon: "✊", color: "#ff6b81", enabled: false, group: "conflict", description: "Demonstrations & riots (ACLED)" },
  { id: "diplomatic", label: "Diplomacy", icon: "🏛️", color: "#dfe6e9", enabled: false, group: "conflict", description: "Strategic diplomatic events" },
  { id: "military-flights", label: "Military Flights", icon: "🛩️", color: "#e74c3c", enabled: false, group: "conflict", description: "Military aircraft (ADS-B filtered)" },

  // ── Natural & Environment ──
  { id: "natural", label: "Natural Disasters", icon: "🌍", color: "#00ff88", enabled: true, group: "natural", description: "Earthquakes, floods, storms" },
  { id: "earthquakes", label: "Earthquakes", icon: "🌋", color: "#e17055", enabled: false, group: "natural", description: "USGS seismic events (M2.5+)" },
  { id: "fires", label: "Wildfires", icon: "🔥", color: "#ff7675", enabled: false, group: "natural", description: "NASA FIRMS thermal anomalies" },
  { id: "weather-alerts", label: "Weather Alerts", icon: "⛈️", color: "#74b9ff", enabled: false, group: "natural", description: "Severe weather warnings" },
  { id: "air-quality", label: "Air Quality", icon: "💨", color: "#a29bfe", enabled: false, group: "natural", description: "PM2.5 pollution levels" },
  { id: "radiation", label: "Radiation", icon: "☢️", color: "#fdcb6e", enabled: false, group: "natural", description: "Safecast radiation monitoring" },

  // ── Cyber & Tech ──
  { id: "cyber", label: "Cyber Threats", icon: "🛡️", color: "#00e5ff", enabled: false, group: "cyber", description: "CVE exploits & ransomware" },
  { id: "ransomware", label: "Ransomware", icon: "🔓", color: "#e84393", enabled: false, group: "cyber", description: "Active ransomware incidents" },
  { id: "power-outages", label: "Power Outages", icon: "💡", color: "#ffeaa7", enabled: false, group: "cyber", description: "Cloudflare internet outages" },
  { id: "tech", label: "Tech", icon: "💻", color: "#8a5cf6", enabled: false, group: "cyber", description: "AI, semiconductors, launches" },

  // ── Finance & Markets ──
  { id: "markets", label: "Markets", icon: "📊", color: "#ffd000", enabled: false, group: "finance", description: "Stock exchanges & crypto hubs" },
  { id: "crypto-heatmap", label: "Crypto Volume", icon: "₿", color: "#f7931a", enabled: false, group: "finance", description: "Crypto trading volume by region" },
  { id: "energy-grid", label: "Energy Grid", icon: "⚡", color: "#f39c12", enabled: false, group: "finance", description: "CO2 intensity & energy status" },

  // ── Infrastructure ──
  { id: "submarine-cables", label: "Submarine Cables", icon: "🔌", color: "#0984e3", enabled: false, group: "infrastructure", description: "Undersea fiber optic cables" },
  { id: "gps-jamming", label: "GPS Jamming", icon: "📡", color: "#d63031", enabled: false, group: "infrastructure", description: "GPS interference zones" },
  { id: "disease", label: "Disease Outbreaks", icon: "🦠", color: "#00b894", enabled: false, group: "infrastructure", description: "WHO disease alerts" },
  { id: "space-launches", label: "Space Launches", icon: "🚀", color: "#6c5ce7", enabled: false, group: "infrastructure", description: "Upcoming & recent launches" },

  // ── Tracking ──
  { id: "aviation", label: "Flights", icon: "✈️", color: "#8a5cf6", enabled: false, group: "tracking", description: "Live ADS-B aircraft positions" },
  { id: "vessels", label: "Vessels", icon: "🚢", color: "#00cec9", enabled: false, group: "tracking", description: "AIS ship positions" },
  { id: "vessels-dark", label: "Dark Vessels", icon: "👻", color: "#636e72", enabled: false, group: "tracking", description: "AIS-off suspicious vessels" },
  { id: "satellites", label: "Satellites", icon: "🛰️", color: "#dfe6e9", enabled: false, group: "tracking", description: "ISS, Starlink, military sats" },
];

/** Layer group metadata for UI display */
export const LAYER_GROUPS: Record<string, { label: string; icon: string; color: string }> = {
  conflict: { label: "Conflict & Security", icon: "⚔️", color: "#ff4757" },
  natural: { label: "Natural & Environment", icon: "🌍", color: "#00ff88" },
  cyber: { label: "Cyber & Tech", icon: "🛡️", color: "#00e5ff" },
  finance: { label: "Finance & Markets", icon: "📊", color: "#ffd000" },
  infrastructure: { label: "Infrastructure", icon: "🔌", color: "#0984e3" },
  tracking: { label: "Tracking", icon: "📡", color: "#8a5cf6" },
};

export const MAP_STYLE = "mapbox://styles/mapbox/navigation-night-v1";

export const MAP_INITIAL_VIEW = {
  longitude: 30,
  latitude: 25,
  zoom: 1.5,
  pitch: 35,
  bearing: 0,
};

/** Variant-specific initial map views — focuses on relevant regions */
export const VARIANT_MAP_VIEWS: Record<VariantId, typeof MAP_INITIAL_VIEW> = {
  world: MAP_INITIAL_VIEW,
  tech: {
    longitude: -40,
    latitude: 35,
    zoom: 1.4,
    pitch: 30,
    bearing: -15,
  },
  finance: {
    longitude: -20,
    latitude: 30,
    zoom: 1.5,
    pitch: 30,
    bearing: 10,
  },
  commodity: {
    longitude: 45,
    latitude: 25,
    zoom: 1.5,
    pitch: 30,
    bearing: 5,
  },
  happy: {
    longitude: 0,
    latitude: 20,
    zoom: 1.3,
    pitch: 25,
    bearing: 0,
  },
  conflict: { longitude: 40, latitude: 30, zoom: 1.6, pitch: 35, bearing: 5 },
  cyber: { longitude: -30, latitude: 35, zoom: 1.4, pitch: 30, bearing: -10 },
  weather: { longitude: 0, latitude: 15, zoom: 1.2, pitch: 20, bearing: 0 },
  health: { longitude: 20, latitude: 20, zoom: 1.3, pitch: 25, bearing: 5 },
  energy: { longitude: 45, latitude: 30, zoom: 1.5, pitch: 30, bearing: 10 },
  sports: { longitude: 10, latitude: 40, zoom: 1.4, pitch: 25, bearing: 0 },
};

/** Variant-specific fly-to after map loads (more dramatic entry) */
export const VARIANT_FLY_TO: Record<VariantId, { center: [number, number]; zoom: number; pitch: number; bearing: number }> = {
  world: { center: [35, 30], zoom: 1.6, pitch: 40, bearing: 10 },
  tech: { center: [-50, 38], zoom: 1.8, pitch: 35, bearing: -10 },
  finance: { center: [-10, 35], zoom: 1.7, pitch: 35, bearing: 15 },
  commodity: { center: [50, 28], zoom: 1.7, pitch: 35, bearing: 8 },
  happy: { center: [10, 25], zoom: 1.5, pitch: 30, bearing: 0 },
  conflict: { center: [42, 33], zoom: 1.8, pitch: 40, bearing: 8 },
  cyber: { center: [-20, 38], zoom: 1.6, pitch: 35, bearing: -5 },
  weather: { center: [0, 20], zoom: 1.4, pitch: 25, bearing: 0 },
  health: { center: [25, 25], zoom: 1.5, pitch: 30, bearing: 5 },
  energy: { center: [50, 32], zoom: 1.7, pitch: 35, bearing: 12 },
  sports: { center: [15, 42], zoom: 1.6, pitch: 30, bearing: 0 },
};
