import type { MapLayer } from "@/types/geo";
import type { VariantId } from "@/config/variants";

/**
 * WorldScope Map Layers — 74+ layers across 12 groups.
 * Each layer can be toggled on/off independently.
 * sourceType: "builtin" = existing intel feed, "static" = GeoJSON in /geo/,
 *   "api" = dynamic API, "computed" = client-side, "promoted" = from finance-geo,
 *   "choropleth" = country fill by index.
 */
export const DEFAULT_LAYERS: MapLayer[] = [
  // ═══════════════════════════════════════════
  // INTEL FEED (all events)
  // ═══════════════════════════════════════════
  { id: "intel", label: "Intel Events", icon: "📡", color: "#00e5ff", enabled: false, group: "conflict", description: "All intelligence events on globe", sourceType: "builtin", labelKey: "layers.intel" },

  // ═══════════════════════════════════════════
  // CONFLICT & SECURITY
  // ═══════════════════════════════════════════
  { id: "conflicts", label: "Conflicts", icon: "⚔️", color: "#ff4757", enabled: false, group: "conflict", description: "Active armed conflicts (ACLED)", sourceType: "builtin", labelKey: "layers.conflicts" },
  { id: "protests", label: "Protests", icon: "✊", color: "#ff6b81", enabled: false, group: "conflict", description: "Demonstrations & riots (ACLED)", sourceType: "builtin", labelKey: "layers.protests" },
  { id: "diplomatic", label: "Diplomacy", icon: "🏛️", color: "#dfe6e9", enabled: false, group: "conflict", description: "Strategic diplomatic events", sourceType: "builtin", labelKey: "layers.diplomatic" },
  { id: "terrorism", label: "Terrorism", icon: "💣", color: "#c0392b", enabled: false, group: "conflict", description: "Global terrorism incidents (GTD)", sourceType: "static", sourceUrl: "/geo/terrorism.json", labelKey: "layers.terrorism", maxPoints: 500, renderType: "points" },
  { id: "drone-strikes", label: "Drone Strikes", icon: "🎯", color: "#e74c3c", enabled: false, group: "conflict", description: "US drone strikes (TBIJ)", sourceType: "static", sourceUrl: "/geo/drone-strikes.json", labelKey: "layers.drone-strikes", maxPoints: 300, renderType: "points" },

  // ═══════════════════════════════════════════
  // MILITARY & DEFENSE
  // ═══════════════════════════════════════════
  { id: "military-bases", label: "Military Bases", icon: "🏕️", color: "#e74c3c", enabled: false, group: "military", description: "800+ US military installations worldwide", sourceType: "static", sourceUrl: "/geo/military-bases.json", labelKey: "layers.military-bases", maxPoints: 800, renderType: "points" },
  { id: "military-flights", label: "Military Flights", icon: "🛩️", color: "#e74c3c", enabled: false, group: "military", description: "Military aircraft (ADS-B filtered)", sourceType: "builtin", labelKey: "layers.military-flights" },
  { id: "nuclear-weapons", label: "Nuclear Arsenals", icon: "☢️", color: "#ff3838", enabled: false, group: "military", description: "Nuclear warhead stockpiles by country", sourceType: "choropleth", sourceUrl: "/geo/nuclear-weapons.json", labelKey: "layers.nuclear-weapons", renderType: "choropleth" },
  { id: "arms-trade", label: "Arms Trade", icon: "🔫", color: "#d63031", enabled: false, group: "military", description: "International arms transfers (SIPRI)", sourceType: "choropleth", sourceUrl: "/geo/arms-trade.json", labelKey: "layers.arms-trade", renderType: "choropleth" },

  // ═══════════════════════════════════════════
  // NATURAL HAZARDS
  // ═══════════════════════════════════════════
  { id: "natural", label: "Natural Disasters", icon: "🌍", color: "#00ff88", enabled: false, group: "natural", description: "Earthquakes, floods, storms (GDACS)", sourceType: "builtin", labelKey: "layers.natural" },
  { id: "earthquakes", label: "Earthquakes", icon: "🌋", color: "#e17055", enabled: false, group: "natural", description: "USGS seismic events (M2.5+)", sourceType: "builtin", labelKey: "layers.earthquakes" },
  { id: "fires", label: "Wildfires", icon: "🔥", color: "#ff7675", enabled: false, group: "natural", description: "NASA FIRMS thermal anomalies", sourceType: "builtin", labelKey: "layers.fires" },
  { id: "volcanoes", label: "Volcanoes", icon: "🌋", color: "#d35400", enabled: false, group: "natural", description: "1,400 Holocene volcanoes (Smithsonian GVP)", sourceType: "static", sourceUrl: "/geo/volcanoes.json", labelKey: "layers.volcanoes", maxPoints: 1400, renderType: "points" },
  { id: "tsunamis", label: "Tsunami Warnings", icon: "🌊", color: "#0652DD", enabled: false, group: "natural", description: "NOAA tsunami alerts", sourceType: "api", apiEndpoint: "/api/tsunamis", labelKey: "layers.tsunamis", refreshInterval: 900_000, renderType: "points" },
  { id: "flood-forecast", label: "Flood Forecast", icon: "💧", color: "#3742fa", enabled: false, group: "natural", description: "GloFAS river flood risk", sourceType: "api", apiEndpoint: "/api/flood-forecast", labelKey: "layers.flood-forecast", refreshInterval: 1_800_000, renderType: "points" },
  { id: "radiation", label: "Radiation", icon: "☢️", color: "#fdcb6e", enabled: false, group: "natural", description: "Safecast radiation monitoring", sourceType: "builtin", labelKey: "layers.radiation" },

  // ═══════════════════════════════════════════
  // ENVIRONMENTAL
  // ═══════════════════════════════════════════
  { id: "weather-alerts", label: "Weather Alerts", icon: "⛈️", color: "#74b9ff", enabled: false, group: "environmental", description: "Severe weather warnings", sourceType: "builtin", labelKey: "layers.weather-alerts" },
  { id: "air-quality", label: "Air Quality", icon: "💨", color: "#a29bfe", enabled: false, group: "environmental", description: "PM2.5 pollution levels", sourceType: "builtin", labelKey: "layers.air-quality" },
  { id: "aurora", label: "Aurora Forecast", icon: "🌌", color: "#6c5ce7", enabled: false, group: "environmental", description: "Northern/Southern Lights forecast (NOAA SWPC)", sourceType: "api", apiEndpoint: "/api/aurora", labelKey: "layers.aurora", refreshInterval: 1_800_000, renderType: "heatmap" },
  { id: "solar-storms", label: "Solar Storms", icon: "☀️", color: "#f9ca24", enabled: false, group: "environmental", description: "Solar flare & geomagnetic storm alerts", sourceType: "api", apiEndpoint: "/api/solar-storms", labelKey: "layers.solar-storms", refreshInterval: 900_000, renderType: "points" },
  { id: "day-night", label: "Day / Night", icon: "🌗", color: "#2d3436", enabled: false, group: "environmental", description: "Real-time day/night terminator overlay", sourceType: "computed", labelKey: "layers.day-night", renderType: "polygons" },

  // ═══════════════════════════════════════════
  // MARITIME & SHIPPING
  // ═══════════════════════════════════════════
  { id: "vessels", label: "Vessels (AIS)", icon: "🚢", color: "#00cec9", enabled: false, group: "maritime", description: "AIS ship positions", sourceType: "builtin", labelKey: "layers.vessels" },
  { id: "vessels-dark", label: "Dark Vessels", icon: "👻", color: "#636e72", enabled: false, group: "maritime", description: "AIS-off suspicious vessels", sourceType: "builtin", labelKey: "layers.vessels-dark" },
  { id: "world-ports", label: "World Ports", icon: "⚓", color: "#0984e3", enabled: false, group: "maritime", description: "3,898 global ports", sourceType: "static", sourceUrl: "/geo/world-ports.json", labelKey: "layers.world-ports", maxPoints: 500, renderType: "points" },
  { id: "chokepoints", label: "Chokepoints", icon: "🚧", color: "#e17055", enabled: false, group: "maritime", description: "13 strategic straits & 19 trade routes", sourceType: "static", sourceUrl: "/geo/chokepoints.json", labelKey: "layers.chokepoints", renderType: "points" },
  { id: "nav-warnings", label: "Nav Warnings", icon: "⚠️", color: "#fdcb6e", enabled: false, group: "maritime", description: "NGA maritime navigational warnings", sourceType: "api", apiEndpoint: "/api/nav-warnings", labelKey: "layers.nav-warnings", refreshInterval: 3_600_000, renderType: "points" },
  { id: "piracy", label: "Piracy Incidents", icon: "🏴‍☠️", color: "#2d3436", enabled: false, group: "maritime", description: "7,500+ maritime pirate attacks (IMB)", sourceType: "static", sourceUrl: "/geo/piracy.json", labelKey: "layers.piracy", maxPoints: 500, renderType: "points" },

  // ═══════════════════════════════════════════
  // AIR & SPACE TRACKING
  // ═══════════════════════════════════════════
  { id: "aviation", label: "Flights", icon: "✈️", color: "#8a5cf6", enabled: false, group: "tracking", description: "Live ADS-B aircraft positions", sourceType: "builtin", labelKey: "layers.aviation" },
  { id: "satellites", label: "Satellites", icon: "🛰️", color: "#dfe6e9", enabled: false, group: "tracking", description: "ISS, Starlink, military sats", sourceType: "builtin", labelKey: "layers.satellites" },
  { id: "space-launches", label: "Space Launches", icon: "🚀", color: "#6c5ce7", enabled: false, group: "tracking", description: "Upcoming & recent launches", sourceType: "builtin", labelKey: "layers.space-launches" },

  // ═══════════════════════════════════════════
  // CYBER & TECH
  // ═══════════════════════════════════════════
  { id: "cyber", label: "Cyber Threats", icon: "🛡️", color: "#00e5ff", enabled: false, group: "cyber", description: "CVE exploits & ransomware", sourceType: "builtin", labelKey: "layers.cyber" },
  { id: "ransomware", label: "Ransomware", icon: "🔓", color: "#e84393", enabled: false, group: "cyber", description: "Active ransomware incidents", sourceType: "builtin", labelKey: "layers.ransomware" },
  { id: "power-outages", label: "Internet Outages", icon: "💡", color: "#ffeaa7", enabled: false, group: "cyber", description: "Cloudflare internet outages", sourceType: "builtin", labelKey: "layers.power-outages" },
  { id: "tech", label: "Tech", icon: "💻", color: "#8a5cf6", enabled: false, group: "cyber", description: "AI, semiconductors, launches", sourceType: "builtin", labelKey: "layers.tech" },
  { id: "gps-jamming", label: "GPS Jamming", icon: "📡", color: "#d63031", enabled: false, group: "cyber", description: "GPS interference zones", sourceType: "builtin", labelKey: "layers.gps-jamming" },

  // ═══════════════════════════════════════════
  // INFRASTRUCTURE
  // ═══════════════════════════════════════════
  { id: "submarine-cables", label: "Submarine Cables", icon: "🔌", color: "#0984e3", enabled: false, group: "infrastructure", description: "Undersea fiber optic cables", sourceType: "builtin", labelKey: "layers.submarine-cables" },
  { id: "cable-taps", label: "Cable Taps (NSA)", icon: "🕵️", color: "#636e72", enabled: false, group: "infrastructure", description: "Known surveillance tap points (Snowden)", sourceType: "static", sourceUrl: "/geo/cable-taps.json", labelKey: "layers.cable-taps", renderType: "points" },
  { id: "nuclear-plants", label: "Nuclear Plants", icon: "⚛️", color: "#f9ca24", enabled: false, group: "infrastructure", description: "440 nuclear power plants worldwide", sourceType: "static", sourceUrl: "/geo/nuclear-plants.json", labelKey: "layers.nuclear-plants", maxPoints: 440, renderType: "points" },
  { id: "power-plants", label: "Power Plants", icon: "🏭", color: "#e67e22", enabled: false, group: "infrastructure", description: "Top 5,000 global power plants (WRI)", sourceType: "static", sourceUrl: "/geo/power-plants.json", labelKey: "layers.power-plants", maxPoints: 2000, renderType: "points" },
  { id: "data-centers", label: "Data Centers", icon: "🖥️", color: "#00cec9", enabled: false, group: "infrastructure", description: "6,266 data centers in 155 countries", sourceType: "static", sourceUrl: "/geo/data-centers.json", labelKey: "layers.data-centers", maxPoints: 1000, renderType: "points" },
  { id: "cloud-regions", label: "Cloud Regions", icon: "☁️", color: "#74b9ff", enabled: false, group: "infrastructure", description: "AWS, Azure, GCP region endpoints", sourceType: "static", sourceUrl: "/geo/cloud-regions.json", labelKey: "layers.cloud-regions", renderType: "points" },
  { id: "disease", label: "Disease Outbreaks", icon: "🦠", color: "#00b894", enabled: false, group: "infrastructure", description: "WHO disease alerts", sourceType: "builtin", labelKey: "layers.disease" },

  // ═══════════════════════════════════════════
  // FINANCE & MARKETS
  // ═══════════════════════════════════════════
  { id: "markets", label: "Stock Exchanges", icon: "📊", color: "#ffd000", enabled: false, group: "finance", description: "30 global stock exchanges", sourceType: "promoted", labelKey: "layers.markets", renderType: "points" },
  { id: "central-banks", label: "Central Banks", icon: "🏦", color: "#ff4757", enabled: false, group: "finance", description: "14 major central banks (Fed, ECB, BoJ...)", sourceType: "promoted", labelKey: "layers.central-banks", renderType: "points" },
  { id: "commodity-hubs", label: "Commodity Hubs", icon: "🛢️", color: "#00ff88", enabled: false, group: "finance", description: "CME, ICE, LME trading hubs", sourceType: "promoted", labelKey: "layers.commodity-hubs", renderType: "points" },
  { id: "financial-centers", label: "Financial Centers", icon: "🏙️", color: "#00e5ff", enabled: false, group: "finance", description: "Top 12 global financial centers (GFCI)", sourceType: "promoted", labelKey: "layers.financial-centers", renderType: "points" },
  { id: "crypto-heatmap", label: "Crypto Volume", icon: "₿", color: "#f7931a", enabled: false, group: "finance", description: "Crypto trading volume by region", sourceType: "builtin", labelKey: "layers.crypto-heatmap" },
  { id: "energy-grid", label: "Energy Grid", icon: "⚡", color: "#f39c12", enabled: false, group: "finance", description: "CO2 intensity & energy status", sourceType: "builtin", labelKey: "layers.energy-grid" },

  // ═══════════════════════════════════════════
  // GEOPOLITICAL
  // ═══════════════════════════════════════════
  { id: "embassies", label: "Embassies", icon: "🏛️", color: "#00b894", enabled: false, group: "geopolitical", description: "10,000+ embassies & consulates worldwide", sourceType: "static", sourceUrl: "/geo/embassies.json", labelKey: "layers.embassies", maxPoints: 500, renderType: "points" },
  { id: "un-peacekeeping", label: "UN Peacekeeping", icon: "🕊️", color: "#0984e3", enabled: false, group: "geopolitical", description: "Active UN peacekeeping operations", sourceType: "static", sourceUrl: "/geo/un-peacekeeping.json", labelKey: "layers.un-peacekeeping", renderType: "points" },
  { id: "disputed-territories", label: "Disputed Areas", icon: "🗺️", color: "#e74c3c", enabled: false, group: "geopolitical", description: "Kashmir, N. Cyprus, W. Sahara and more", sourceType: "static", sourceUrl: "/geo/disputed-territories.json", labelKey: "layers.disputed-territories", renderType: "polygons" },
  { id: "sanctions", label: "Sanctions", icon: "🚫", color: "#d63031", enabled: false, group: "geopolitical", description: "Countries under international sanctions", sourceType: "choropleth", sourceUrl: "/geo/sanctions.json", labelKey: "layers.sanctions", renderType: "choropleth" },
  { id: "refugee-camps", label: "Refugees & IDPs", icon: "🏕️", color: "#fdcb6e", enabled: false, group: "geopolitical", description: "UNHCR refugee & displacement data", sourceType: "api", apiEndpoint: "/api/refugee-camps", labelKey: "layers.refugee-camps", refreshInterval: 86_400_000, renderType: "points" },

  // ═══════════════════════════════════════════
  // COUNTRY INDICES
  // ═══════════════════════════════════════════
  { id: "press-freedom", label: "Press Freedom", icon: "📰", color: "#e67e22", enabled: false, group: "indices", description: "RSF Press Freedom Index (180 countries)", sourceType: "choropleth", sourceUrl: "/geo/press-freedom.json", labelKey: "layers.press-freedom", renderType: "choropleth" },
  { id: "corruption", label: "Corruption Index", icon: "💰", color: "#e84393", enabled: false, group: "indices", description: "Transparency International CPI", sourceType: "choropleth", sourceUrl: "/geo/corruption.json", labelKey: "layers.corruption", renderType: "choropleth" },
  { id: "food-insecurity", label: "Food Insecurity", icon: "🍽️", color: "#c0392b", enabled: false, group: "indices", description: "WFP HungerMap food crisis data", sourceType: "choropleth", sourceUrl: "/geo/food-insecurity.json", labelKey: "layers.food-insecurity", renderType: "choropleth" },
];

/** 12 layer groups for UI display */
export const LAYER_GROUPS: Record<string, { label: string; icon: string; color: string }> = {
  conflict: { label: "Conflict & Security", icon: "⚔️", color: "#ff4757" },
  military: { label: "Military & Defense", icon: "🎖️", color: "#e74c3c" },
  natural: { label: "Natural Hazards", icon: "🌍", color: "#00ff88" },
  environmental: { label: "Environment", icon: "🌤️", color: "#74b9ff" },
  maritime: { label: "Maritime & Shipping", icon: "🚢", color: "#00cec9" },
  tracking: { label: "Air & Space", icon: "✈️", color: "#8a5cf6" },
  cyber: { label: "Cyber & Tech", icon: "🛡️", color: "#00e5ff" },
  infrastructure: { label: "Infrastructure", icon: "🔌", color: "#0984e3" },
  finance: { label: "Finance & Markets", icon: "📊", color: "#ffd000" },
  geopolitical: { label: "Geopolitical", icon: "🌐", color: "#00b894" },
  indices: { label: "Country Indices", icon: "📈", color: "#e67e22" },
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
  tech: { longitude: -40, latitude: 35, zoom: 1.4, pitch: 30, bearing: -15 },
  finance: { longitude: -20, latitude: 30, zoom: 1.5, pitch: 30, bearing: 10 },
  commodity: { longitude: 45, latitude: 25, zoom: 1.5, pitch: 30, bearing: 5 },
  happy: { longitude: 0, latitude: 20, zoom: 1.3, pitch: 25, bearing: 0 },
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
