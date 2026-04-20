"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import Globe from "react-globe.gl";
import { useTheme } from "@/components/shared/ThemeProvider";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { useFlightTracker } from "@/hooks/useFlightTracker";
import { useVesselTracker } from "@/hooks/useVesselTracker";
import { useWeatherData, type WeatherCity } from "@/hooks/useWeatherData";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";
import type { VariantId } from "@/config/variants";
import { FlightSearch, type FlightSearchResult } from "./FlightSearch";
import { useGlobeOverlays } from "@/hooks/useGlobeOverlays";

const SEVERITY_SIZE: Record<string, number> = {
  critical: 1.0, high: 0.55, medium: 0.3, low: 0.12, info: 0.06,
};

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  label: string;
  item?: IntelItem;
}

interface Globe3DProps {
  variant?: VariantId;
  onEventClick?: (item: IntelItem) => void;
  enabledLayers?: Set<string>;
}

/* ── Inline event detail card ── */
function GlobeEventCard({ item, onClose }: { item: IntelItem; onClose: () => void }) {
  const icon = CATEGORY_ICONS[item.category] || "📌";
  return (
    <div className="absolute top-4 right-4 z-20 w-64 bg-[#0a1530]/90 backdrop-blur-md border border-[#00e5ff]/20 rounded-lg p-3 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
      <button onClick={onClose} className="absolute top-2 right-2 text-[#64748b] hover:text-[#e2e8f0] font-mono text-xs leading-none">×</button>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: SEVERITY_COLORS[item.severity] }} />
        <span className="font-mono text-[8px] font-bold tracking-wider uppercase" style={{ color: SEVERITY_COLORS[item.severity] }}>{item.severity}</span>
        <span className="ml-auto font-mono text-[7px] text-[#64748b]">{timeAgo(item.publishedAt)}</span>
      </div>
      <h4 className="font-mono text-[10px] font-bold text-[#e2e8f0] leading-tight mb-1.5">{item.title.slice(0, 80)}</h4>
      {item.lat != null && item.lng != null && (
        <p className="font-mono text-[8px] text-[#00e5ff]/70 mb-2">{item.lat.toFixed(2)}°N, {item.lng.toFixed(2)}°E</p>
      )}
      <div className="flex items-center justify-between border-t border-[#00e5ff]/10 pt-1.5 mt-1">
        <span className="font-mono text-[7px] text-[#64748b]">{icon} {item.category.toUpperCase()}</span>
        <span className="font-mono text-[7px] text-[#64748b]">{item.source || "OSINT"}</span>
      </div>
    </div>
  );
}

/**
 * Unified 3D Globe — starts clean with no data.
 * All layers (intel, flights, ships, weather, fires, satellites, etc.)
 * are toggled via the layer system using enabledLayers.
 */
/** Mythological sacred anchor points — always pulse, independent of data layers.
 *  Troia (Hisarlik, the brand anchor), Olympus (Mt Olympus, seat of gods),
 *  Delphi (the oracle). Visually ties the globe to the pantheon theme. */
const SACRED_RINGS = [
  { lat: 39.96, lng: 26.24, maxR: 3, propagationSpeed: 0.9, repeatPeriod: 2200, color: "#ffc55a" },
  { lat: 40.08, lng: 22.36, maxR: 3, propagationSpeed: 0.9, repeatPeriod: 2200, color: "#ffc55a" },
  { lat: 38.48, lng: 22.50, maxR: 3, propagationSpeed: 0.9, repeatPeriod: 2200, color: "#ffc55a" },
];

export function Globe3D({ variant: _variant = "world", onEventClick, enabledLayers }: Globe3DProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const { theme } = useTheme();
  const { items } = useIntelFeed();
  const { aircraft } = useFlightTracker();
  const { vessels } = useVesselTracker();
  const { cities: weatherCities } = useWeatherData();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchedFlight, setSearchedFlight] = useState<FlightSearchResult | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IntelItem | null>(null);

  // Generic overlay hook for static/api layers (military-bases, volcanoes, ports, etc.)
  const genericOverlayPoints = useGlobeOverlays(enabledLayers);
  const handleFlightResult = useCallback((r: FlightSearchResult | null) => setSearchedFlight(r), []);

  // ── Overlay state for non-builtin layers ──
  const [firePoints, setFirePoints] = useState<GlobePoint[]>([]);
  const [satellitePoints, setSatellitePoints] = useState<GlobePoint[]>([]);
  const [darkVesselPoints, setDarkVesselPoints] = useState<GlobePoint[]>([]);

  // ── Fires overlay ──
  useEffect(() => {
    if (!enabledLayers?.has("fires")) { setFirePoints([]); return; }
    fetch("/api/intel?source=NASA+FIRMS&limit=50").then(r => r.json()).then(data => {
      const pts = (data.items || data || [])
        .filter((i: Record<string, unknown>) => i.lat && i.lng)
        .slice(0, 50)
        .map((i: Record<string, unknown>) => ({
          lat: Number(i.lat), lng: Number(i.lng), size: 0.25,
          color: "#ff7675", label: "🔥 " + String(i.title || "Fire Hotspot"),
        }));
      setFirePoints(pts);
    }).catch(() => setFirePoints([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledLayers?.has("fires")]);

  // ── Satellites overlay ──
  useEffect(() => {
    if (!enabledLayers?.has("satellites")) { setSatellitePoints([]); return; }
    fetch("/api/satellites").then(r => r.json()).then(data => {
      const pts = (data.satellites || []).map((s: Record<string, unknown>) => ({
        lat: Number(s.latitude), lng: Number(s.longitude), size: 0.08,
        color: String(s.category) === "military" ? "#ff4757" : String(s.category) === "station" ? "#00e5ff" : "#dfe6e9",
        label: "🛰️ " + String(s.name || "Satellite") + " | ALT " + Math.round(Number(s.altitude || 0)) + "km",
      }));
      setSatellitePoints(pts);
    }).catch(() => setSatellitePoints([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledLayers?.has("satellites")]);

  // ── Dark vessels overlay ──
  useEffect(() => {
    if (!enabledLayers?.has("vessels-dark")) { setDarkVesselPoints([]); return; }
    const darkZones = [
      { lat: 25.5, lng: 56, name: "Strait of Hormuz" },
      { lat: 2.5, lng: 102, name: "Strait of Malacca" },
      { lat: 3, lng: 1.5, name: "Gulf of Guinea" },
      { lat: 6.5, lng: 48, name: "Horn of Africa" },
      { lat: 13, lng: 113, name: "South China Sea" },
      { lat: 43.5, lng: 34.5, name: "Black Sea" },
      { lat: 34, lng: 31.5, name: "Eastern Mediterranean" },
    ];
    setDarkVesselPoints(darkZones.map(z => ({
      lat: z.lat, lng: z.lng, size: 0.6, color: "#636e72",
      label: "👻 Dark Zone: " + z.name,
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledLayers?.has("vessels-dark")]);

  const geoItems = useMemo(() => items.filter((item) => item.lat != null && item.lng != null), [items]);

  // ── INTEL: layer-toggled via "intel" layer ──
  const intelPoints = useMemo(() => {
    if (!enabledLayers?.has("intel")) return [];
    return geoItems.map((item) => ({
      lat: item.lat!, lng: item.lng!,
      size: SEVERITY_SIZE[item.severity] || 0.15,
      color: SEVERITY_COLORS[item.severity] || "#00e5ff",
      label: item.severity.toUpperCase() + " — " + item.title.slice(0, 60),
      item,
    }));
  }, [geoItems, enabledLayers]);

  const intelRings = useMemo(() => {
    if (!enabledLayers?.has("intel")) return [];
    return geoItems
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .slice(0, 30)
      .map((i) => ({ lat: i.lat!, lng: i.lng!, maxR: i.severity === "critical" ? 4 : 2, propagationSpeed: i.severity === "critical" ? 3 : 1.5, repeatPeriod: i.severity === "critical" ? 1000 : 1500 }));
  }, [geoItems, enabledLayers]);

  // ── FLIGHTS: layer-toggled ──
  const flightPoints = useMemo<GlobePoint[]>(() => {
    if (!enabledLayers?.has("aviation") || !aircraft?.length) return [];
    return aircraft.filter((f) => f.latitude != null && f.longitude != null && !f.onGround).slice(0, 80)
      .map((f) => ({ lat: f.latitude!, lng: f.longitude!, size: f.category === "military" ? 0.15 : 0.08, color: f.category === "military" ? "#ff4757" : "#ffd000", label: (f.callsign || "?") + " | ALT " + (f.altitude ? Math.round(f.altitude) + "m" : "?") + " | " + f.originCountry }));
  }, [aircraft, enabledLayers]);

  const flightArc = useMemo(() => {
    if (!enabledLayers?.has("aviation") || !searchedFlight?.route.origin || !searchedFlight?.route.destination) return [];
    return [{ startLat: searchedFlight.route.origin.lat, startLng: searchedFlight.route.origin.lng, endLat: searchedFlight.route.destination.lat, endLng: searchedFlight.route.destination.lng, color: "#00e5ff" }];
  }, [searchedFlight, enabledLayers]);

  // ── SHIPS: layer-toggled ──
  const shipPoints = useMemo<GlobePoint[]>(() => {
    if (!enabledLayers?.has("vessels") || !vessels?.length) return [];
    return vessels.slice(0, 80).map((v) => ({ lat: v.latitude, lng: v.longitude, size: v.shipType === "military" ? 0.12 : 0.06, color: v.shipType === "military" ? "#ff4757" : v.shipType === "tanker" ? "#ffd000" : "#00ff88", label: (v.name || "?") + " | " + v.shipType + " | " + (v.flag || "?") }));
  }, [vessels, enabledLayers]);

  // ── WEATHER: layer-toggled ──
  const weatherPoints = useMemo<GlobePoint[]>(() => {
    if (!enabledLayers?.has("weather-alerts")) return [];
    return weatherCities.map((c: WeatherCity) => {
      const color = c.isExtreme ? "#ff4757" : c.temperature > 35 ? "#ff9f43" : c.temperature > 20 ? "#ffd000" : c.temperature > 5 ? "#00e5ff" : c.temperature > -10 ? "#8a5cf6" : "#ffffff";
      return {
        lat: c.lat, lng: c.lng,
        size: c.isExtreme ? 0.6 : 0.3,
        color,
        label: `${c.city}, ${c.country} | ${c.temperature}°C | ${c.weatherLabel} | Wind ${c.windSpeed} km/h`,
      };
    });
  }, [weatherCities, enabledLayers]);

  const weatherRings = useMemo(() => {
    if (!enabledLayers?.has("weather-alerts")) return [];
    return weatherCities
      .filter((c: WeatherCity) => c.isExtreme)
      .map((c: WeatherCity) => ({ lat: c.lat, lng: c.lng, maxR: 5, propagationSpeed: 2, repeatPeriod: 2000 }));
  }, [weatherCities, enabledLayers]);

  // ── MERGE: all layer-toggled overlays ──
  const pointsData = useMemo(() => {
    return [
      ...intelPoints,
      ...flightPoints,
      ...shipPoints,
      ...weatherPoints,
      ...firePoints,
      ...satellitePoints,
      ...darkVesselPoints,
      ...genericOverlayPoints,
    ];
  }, [intelPoints, flightPoints, shipPoints, weatherPoints, firePoints, satellitePoints, darkVesselPoints, genericOverlayPoints]);

  const ringsData = useMemo(() => {
    return [...intelRings, ...weatherRings];
  }, [intelRings, weatherRings]);

  const hasAnyLayer = pointsData.length > 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => { const { width, height } = entries[0].contentRect; setDimensions({ w: Math.round(width), h: Math.round(height) }); });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    if (controls) { controls.autoRotate = true; controls.autoRotateSpeed = 0.3; controls.enableDamping = true; }
  }, []);

  // Hover pauses auto-rotation so users can read overlays / click markers.
  // Resumes after pointer leaves the globe container.
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    if (!controls) return;
    controls.autoRotate = !isHovered;
  }, [isHovered]);

  const handlePointClick = useCallback((point: object) => {
    const p = point as { item?: IntelItem };
    if (p.item) {
      setSelectedEvent(p.item);
      if (onEventClick) onEventClick(p.item);
    }
  }, [onEventClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-black"
      role="img"
      aria-label="Interactive 3D globe showing global intelligence events"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer atmosphere glow ring — theme-adaptive */}
      <div className="absolute inset-0 pointer-events-none z-[1] flex items-center justify-center">
        <div
          className="w-[85%] h-[85%] max-w-[600px] max-h-[600px] rounded-full"
          style={{
            background: `radial-gradient(circle, transparent 45%, ${theme.colors.accent}10 55%, ${theme.colors.accent}30 62%, ${theme.colors.accent}15 70%, transparent 78%)`,
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* ── Anemoi — four ancient Greek winds at compass points ──
           Overlay only; the globe underneath stays interactive because
           labels have pointer-events-none. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-[2] font-serif italic tracking-[0.22em] text-[11px] md:text-[12px]"
        style={{ color: theme.colors.accent, textShadow: `0 0 14px ${theme.colors.accent}aa` }}
      >
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-center">
          ΒΟΡΕΑΣ
          <span className="block font-sans not-italic text-[8px] tracking-[0.22em] opacity-70 mt-0.5">north</span>
        </span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
          ΝΟΤΟΣ
          <span className="block font-sans not-italic text-[8px] tracking-[0.22em] opacity-70 mt-0.5">south</span>
        </span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 rotate-90 origin-center">
          ΕΥΡΟΣ
          <span className="block font-sans not-italic text-[8px] tracking-[0.22em] opacity-70 mt-0.5">east</span>
        </span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
          ΖΕΦΥΡΟΣ
          <span className="block font-sans not-italic text-[8px] tracking-[0.22em] opacity-70 mt-0.5">west</span>
        </span>
      </div>

      {/* ── Corner brackets — A2 mockup signature ── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-[2]">
        <span
          className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-l border-t"
          style={{ borderColor: theme.colors.accent, opacity: 0.7 }}
        />
        <span
          className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-r border-t"
          style={{ borderColor: theme.colors.accent, opacity: 0.7 }}
        />
        <span
          className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-l border-b"
          style={{ borderColor: theme.colors.accent, opacity: 0.7 }}
        />
        <span
          className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-r border-b"
          style={{ borderColor: theme.colors.accent, opacity: 0.7 }}
        />
      </div>

      {/* ── Omphalos — "navel of the world" — Troia coordinates ── */}
      <div
        aria-hidden="true"
        className="absolute bottom-2 left-3 z-[3] font-serif italic text-[10px] md:text-[11px] tracking-[0.12em]"
        style={{ color: "#c5bfae" }}
      >
        <span style={{ color: theme.colors.accent, fontWeight: 600 }}>Ὀμφαλός</span>
        {" · 39.96°N · 26.24°E · "}
        <span style={{ color: theme.colors.accent }}>ΤΡΟΙΑ</span>
      </div>

      {/* ── Hover hint — shows "HOVER TO PAUSE" until the user hovers ── */}
      {!isHovered && (
        <div
          aria-hidden="true"
          className="absolute bottom-2 right-3 z-[3] font-mono text-[9px] tracking-[0.25em] text-gray-500"
        >
          ⊙ HOVER TO PAUSE
        </div>
      )}

      <Globe
        ref={globeRef}
        width={dimensions.w}
        height={dimensions.h}
        // Stylised pantheon globe — no realistic night-texture / sky box.
        // The atmosphere, sacred rings, arcs, and data layers do the work.
        globeImageUrl={null}
        bumpImageUrl={null}
        backgroundImageUrl={null}
        backgroundColor="rgba(0,0,0,0)"
        showGraticules
        atmosphereColor={theme.colors.accent}
        atmosphereAltitude={0.22}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.015}
        pointRadius="size"
        pointColor="color"
        pointLabel="label"
        pointsMerge={pointsData.length > 150}
        onPointClick={handlePointClick}
        // Sacred anchor rings pulse permanently; intel rings overlay on top.
        ringsData={[...SACRED_RINGS, ...ringsData]}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor={(d: { color?: string }) => d.color ?? "#ff475760"}
        arcsData={flightArc}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1200}
        arcStroke={1.8}
        animateIn={true}
        waitForGlobeReady={true}
      />

      {enabledLayers?.has("aviation") && <FlightSearch onResult={handleFlightResult} />}

      {/* Event detail card */}
      {selectedEvent && <GlobeEventCard item={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      {/* Status bar — only visible when layers are active */}
      {hasAnyLayer ? (
        <div className="absolute bottom-3 left-3 z-10">
          <div className="bg-[#0a1530]/85 backdrop-blur-sm border border-[#00e5ff]/15 rounded-md px-3 py-1.5 flex items-center gap-3">
            {intelPoints.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                <span className="font-mono text-[8px] font-bold tracking-wider text-[#00e5ff]">{intelPoints.length} EVENTS</span>
              </span>
            )}
            {flightPoints.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffd000]" />
                <span className="font-mono text-[8px] font-bold tracking-wider text-[#ffd000]">{flightPoints.length} AIRCRAFT</span>
              </span>
            )}
            {shipPoints.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                <span className="font-mono text-[8px] font-bold tracking-wider text-[#00ff88]">{shipPoints.length} VESSELS</span>
              </span>
            )}
            {weatherPoints.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8a5cf6]" />
                <span className="font-mono text-[8px] font-bold tracking-wider text-[#8a5cf6]">{weatherPoints.length} WEATHER</span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-[#0a1530]/70 backdrop-blur-sm border border-[#00e5ff]/10 rounded-md px-4 py-1.5">
            <span className="font-mono text-[8px] tracking-wider text-[#64748b]">SELECT A LAYER TO VIEW DATA</span>
          </div>
        </div>
      )}

      {/* Severity legend — only when intel layer active */}
      {intelPoints.length > 0 && (
        <div className="absolute bottom-3 right-3 z-10">
          <div className="bg-[#0a1530]/85 backdrop-blur-sm border border-[#00e5ff]/15 rounded-md px-3 py-1.5 flex items-center gap-3">
            {([["critical", "CRIT"], ["high", "HIGH"], ["medium", "MED"], ["low", "LOW"]] as const).map(([sev, label]) => (
              <span key={sev} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
                <span className="font-mono text-[7px] text-[#8892a4] tracking-wider">{label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
