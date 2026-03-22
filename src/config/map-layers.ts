import type { MapLayer } from "@/types/geo";
import type { VariantId } from "@/config/variants";

export const DEFAULT_LAYERS: MapLayer[] = [
  { id: "conflicts", label: "Conflicts", icon: "⚔️", color: "#ff4757", enabled: true },
  { id: "markets", label: "Markets", icon: "📊", color: "#ffd000", enabled: false },
  { id: "cyber", label: "Cyber", icon: "🛡️", color: "#00e5ff", enabled: false },
  { id: "natural", label: "Natural", icon: "🌍", color: "#00ff88", enabled: true },
  { id: "aviation", label: "Aviation", icon: "✈️", color: "#8a5cf6", enabled: false },
  { id: "tech", label: "Tech", icon: "💻", color: "#8a5cf6", enabled: false },
];

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
