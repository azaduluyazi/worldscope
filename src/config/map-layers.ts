import type { MapLayer } from "@/types/geo";

export const DEFAULT_LAYERS: MapLayer[] = [
  { id: "conflicts", label: "Conflicts", icon: "⚔️", color: "#ff4757", enabled: true },
  { id: "markets", label: "Markets", icon: "📊", color: "#ffd000", enabled: false },
  { id: "cyber", label: "Cyber", icon: "🛡️", color: "#00e5ff", enabled: false },
  { id: "natural", label: "Natural", icon: "🌍", color: "#00ff88", enabled: true },
  { id: "aviation", label: "Aviation", icon: "✈️", color: "#8a5cf6", enabled: false },
  { id: "tech", label: "Tech", icon: "💻", color: "#8a5cf6", enabled: false },
];

export const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

export const MAP_INITIAL_VIEW = {
  longitude: 20,
  latitude: 20,
  zoom: 1.8,
  pitch: 40,
  bearing: -10,
};
