import type { LiveWebcam } from "./types";

/**
 * Live webcam feeds from key global cities.
 * YouTube-based webcams with stable stream IDs — always free tier.
 */
export const LIVE_WEBCAMS: LiveWebcam[] = [
  // ── Middle East ──
  { id: "jerusalem", city: "Jerusalem", country: "IL", videoId: "jJbKaOFjqiI", region: "mideast", color: "#ff4757" },
  { id: "mecca", city: "Mecca", country: "SA", videoId: "gRbiBkFbh0E", region: "mideast", color: "#ffd000" },
  { id: "dubai", city: "Dubai", country: "AE", videoId: "GfB5dbkh1QU", region: "mideast", color: "#00e5ff" },
  // ── Europe ──
  { id: "london", city: "London", country: "GB", videoId: "54m573U9dz0", region: "europe", color: "#00e5ff" },
  { id: "paris", city: "Paris", country: "FR", videoId: "26PFj9-3Cqg", region: "europe", color: "#8a5cf6" },
  { id: "rome", city: "Rome", country: "IT", videoId: "A8r44Bz5XEY", region: "europe", color: "#00ff88" },
  // ── Americas ──
  { id: "nyc", city: "New York", country: "US", videoId: "1-iS7LArMPA", region: "americas", color: "#ffd000" },
  { id: "miami", city: "Miami", country: "US", videoId: "FhLCABMlo1c", region: "americas", color: "#00ff88" },
  // ── Asia ──
  { id: "tokyo", city: "Tokyo", country: "JP", videoId: "DjYZk8nrXVY", region: "asia", color: "#ff4757" },
  { id: "seoul", city: "Seoul", country: "KR", videoId: "8Jqfl3GM3GU", region: "asia", color: "#00e5ff" },
  // ── Space ──
  { id: "iss", city: "ISS", country: "SPACE", videoId: "P9C25Un7xaM", region: "space", color: "#8a5cf6" },
];

export const WEBCAM_REGIONS = [
  { id: "all", label: "ALL" },
  { id: "mideast", label: "MIDDLE EAST" },
  { id: "europe", label: "EUROPE" },
  { id: "americas", label: "AMERICAS" },
  { id: "asia", label: "ASIA" },
  { id: "space", label: "SPACE" },
] as const;
