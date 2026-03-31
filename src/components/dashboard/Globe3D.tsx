"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import Globe from "react-globe.gl";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { useFlightTracker } from "@/hooks/useFlightTracker";
import { useVesselTracker } from "@/hooks/useVesselTracker";
import { useWeatherData, type WeatherCity } from "@/hooks/useWeatherData";
import { SEVERITY_COLORS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import type { VariantId } from "@/config/variants";
import { FlightSearch, type FlightSearchResult } from "./FlightSearch";

const SEVERITY_SIZE: Record<string, number> = {
  critical: 0.8, high: 0.5, medium: 0.3, low: 0.15, info: 0.08,
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

/**
 * Unified 3D Globe — always shows intel events as the base layer.
 * All other data (flights, ships, weather, fires, satellites, etc.) are
 * toggled via the layer system using enabledLayers.
 */
export function Globe3D({ variant: _variant = "world", onEventClick, enabledLayers }: Globe3DProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const { items } = useIntelFeed();
  const { aircraft } = useFlightTracker();
  const { vessels } = useVesselTracker();
  const { cities: weatherCities } = useWeatherData();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchedFlight, setSearchedFlight] = useState<FlightSearchResult | null>(null);
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

  // ── INTEL: always visible — base layer ──
  const intelPoints = useMemo(() => {
    return geoItems.map((item) => ({
      lat: item.lat!, lng: item.lng!,
      size: SEVERITY_SIZE[item.severity] || 0.15,
      color: SEVERITY_COLORS[item.severity] || "#00e5ff",
      label: item.severity.toUpperCase() + " — " + item.title.slice(0, 60),
      item,
    }));
  }, [geoItems]);

  const intelRings = useMemo(() => {
    return geoItems
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .slice(0, 30)
      .map((i) => ({ lat: i.lat!, lng: i.lng!, maxR: i.severity === "critical" ? 4 : 2, propagationSpeed: i.severity === "critical" ? 3 : 1.5, repeatPeriod: i.severity === "critical" ? 1000 : 1500 }));
  }, [geoItems]);

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

  // ── MERGE: intel (always) + all enabled overlays ──
  const pointsData = useMemo(() => {
    const overlays: GlobePoint[] = [
      ...flightPoints,
      ...shipPoints,
      ...weatherPoints,
      ...firePoints,
      ...satellitePoints,
      ...darkVesselPoints,
    ];
    return overlays.length > 0 ? [...intelPoints, ...overlays] : intelPoints;
  }, [intelPoints, flightPoints, shipPoints, weatherPoints, firePoints, satellitePoints, darkVesselPoints]);

  const ringsData = useMemo(() => {
    return [...intelRings, ...weatherRings];
  }, [intelRings, weatherRings]);

  const overlayCount = pointsData.length - intelPoints.length;

  const statusLabel = useMemo(() => {
    const parts: string[] = [`${geoItems.length} EVENTS`];
    if (flightPoints.length) parts.push(`${flightPoints.length} AIRCRAFT`);
    if (shipPoints.length) parts.push(`${shipPoints.length} VESSELS`);
    if (weatherPoints.length) parts.push(`${weatherPoints.length} WEATHER`);
    if (overlayCount > (flightPoints.length + shipPoints.length + weatherPoints.length))
      parts.push(`+${overlayCount - flightPoints.length - shipPoints.length - weatherPoints.length} OVERLAY`);
    return parts.join(" | ");
  }, [geoItems.length, flightPoints.length, shipPoints.length, weatherPoints.length, overlayCount]);

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
    if (controls) { controls.autoRotate = true; controls.autoRotateSpeed = 0.4; controls.enableDamping = true; }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black" role="img" aria-label="Interactive 3D globe showing global intelligence events">
      <Globe ref={globeRef} width={dimensions.w} height={dimensions.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#00e5ff" atmosphereAltitude={0.15}
        pointsData={pointsData} pointLat="lat" pointLng="lng" pointAltitude={0.01} pointRadius="size" pointColor="color" pointLabel="label" pointsMerge={false}
        onPointClick={(point: object) => { const p = point as { item?: IntelItem }; if (p.item && onEventClick) onEventClick(p.item); }}
        ringsData={ringsData} ringLat="lat" ringLng="lng" ringMaxRadius="maxR" ringPropagationSpeed="propagationSpeed" ringRepeatPeriod="repeatPeriod" ringColor={() => "#ff475760"}
        arcsData={flightArc} arcStartLat="startLat" arcStartLng="startLng" arcEndLat="endLat" arcEndLng="endLng" arcColor="color" arcDashLength={0.4} arcDashGap={0.2} arcDashAnimateTime={1500} arcStroke={1.5}
        animateIn={true} waitForGlobeReady={true}
      />

      {enabledLayers?.has("aviation") && <FlightSearch onResult={handleFlightResult} />}

      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-hud-panel/80 backdrop-blur-sm border border-hud-border rounded px-2.5 py-1.5">
          <span className="font-mono text-[8px] font-bold tracking-wider text-hud-accent">{statusLabel}</span>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-10">
        <div className="bg-hud-panel/80 backdrop-blur-sm border border-hud-border rounded px-2 py-1.5 flex flex-col gap-0.5">
          {(["critical", "high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
              <span className="font-mono text-[7px] text-hud-muted">{sev.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
