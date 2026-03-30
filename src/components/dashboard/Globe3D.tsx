"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import Globe from "react-globe.gl";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { useFlightTracker } from "@/hooks/useFlightTracker";
import { useVesselTracker } from "@/hooks/useVesselTracker";
import { useWeatherData, type WeatherCity } from "@/hooks/useWeatherData";
import { SEVERITY_COLORS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { VARIANTS, type VariantId } from "@/config/variants";
import { FlightSearch, type FlightSearchResult } from "./FlightSearch";
import type { MapMode } from "./MapViewToggle";

const SEVERITY_SIZE: Record<string, number> = {
  critical: 0.8, high: 0.5, medium: 0.3, low: 0.15, info: 0.08,
};

interface Globe3DProps {
  variant?: VariantId;
  onEventClick?: (item: IntelItem) => void;
  globeMode?: MapMode;
  enabledLayers?: Set<string>;
}

export function Globe3D({ variant = "world", onEventClick, globeMode = "globe-intel", enabledLayers }: Globe3DProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const { items } = useIntelFeed();
  const { aircraft } = useFlightTracker();
  const { vessels } = useVesselTracker();
  const { cities: weatherCities } = useWeatherData();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const variantConfig = VARIANTS[variant];
  const [searchedFlight, setSearchedFlight] = useState<FlightSearchResult | null>(null);
  const handleFlightResult = useCallback((r: FlightSearchResult | null) => setSearchedFlight(r), []);

  // Layer-aware data sources for overlay points
  const [firePoints, setFirePoints] = useState<Array<{ lat: number; lng: number; size: number; color: string; label: string }>>([]);
  const [satellitePoints, setSatellitePoints] = useState<Array<{ lat: number; lng: number; size: number; color: string; label: string }>>([]);
  const [darkVesselPoints, setDarkVesselPoints] = useState<Array<{ lat: number; lng: number; size: number; color: string; label: string }>>([]);

  // Fetch overlay data when layers are enabled
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [enabledLayers?.has("fires")]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!enabledLayers?.has("satellites")) { setSatellitePoints([]); return; }
    fetch("/api/satellites").then(r => r.json()).then(data => {
      const pts = (data.satellites || []).map((s: Record<string, unknown>) => ({
        lat: Number(s.latitude), lng: Number(s.longitude), size: 0.08,
        color: String(s.category) === "military" ? "#ff4757" : String(s.category) === "station" ? "#00e5ff" : "#dfe6e9",
        label: "🛰️ " + String(s.name || "Satellite") + " | ALT " + Math.round(Number(s.altitude || 0)) + "km",
      }));
      setSatellitePoints(pts);
    }).catch(() => setSatellitePoints([]));
  }, [enabledLayers?.has("satellites")]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!enabledLayers?.has("vessels-dark")) { setDarkVesselPoints([]); return; }
    // Dark vessels come from the vessel tracker diff — use a marker for known dark zones
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
  }, [enabledLayers?.has("vessels-dark")]);

  const geoItems = useMemo(() => items.filter((item) => item.lat != null && item.lng != null), [items]);

  // INTEL: dots + rings
  const intelPoints = useMemo(() => {
    if (globeMode !== "globe-intel") return [];
    return geoItems.map((item) => ({
      lat: item.lat!, lng: item.lng!,
      size: SEVERITY_SIZE[item.severity] || 0.15,
      color: SEVERITY_COLORS[item.severity] || "#00e5ff",
      label: item.severity.toUpperCase() + " — " + item.title.slice(0, 60),
      item,
    }));
  }, [geoItems, globeMode]);

  const intelRings = useMemo(() => {
    if (globeMode !== "globe-intel") return [];
    return geoItems
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .slice(0, 30)
      .map((i) => ({ lat: i.lat!, lng: i.lng!, maxR: i.severity === "critical" ? 4 : 2, propagationSpeed: i.severity === "critical" ? 3 : 1.5, repeatPeriod: i.severity === "critical" ? 1000 : 1500 }));
  }, [geoItems, globeMode]);

  // FLIGHTS: dots
  const flightPoints = useMemo(() => {
    if (globeMode !== "globe-flights" || !aircraft?.length) return [];
    return aircraft.filter((f) => f.latitude != null && f.longitude != null && !f.onGround).slice(0, 80)
      .map((f) => ({ lat: f.latitude!, lng: f.longitude!, size: f.category === "military" ? 0.15 : 0.08, color: f.category === "military" ? "#ff4757" : "#ffd000", label: (f.callsign || "?") + " | ALT " + (f.altitude ? Math.round(f.altitude) + "m" : "?") + " | " + f.originCountry }));
  }, [aircraft, globeMode]);

  const flightArc = useMemo(() => {
    if (globeMode !== "globe-flights" || !searchedFlight?.route.origin || !searchedFlight?.route.destination) return [];
    return [{ startLat: searchedFlight.route.origin.lat, startLng: searchedFlight.route.origin.lng, endLat: searchedFlight.route.destination.lat, endLng: searchedFlight.route.destination.lng, color: "#00e5ff" }];
  }, [searchedFlight, globeMode]);

  // SHIPS: dots
  const shipPoints = useMemo(() => {
    if (globeMode !== "globe-ships" || !vessels?.length) return [];
    return vessels.slice(0, 80).map((v) => ({ lat: v.latitude, lng: v.longitude, size: v.shipType === "military" ? 0.12 : 0.06, color: v.shipType === "military" ? "#ff4757" : v.shipType === "tanker" ? "#ffd000" : "#00ff88", label: (v.name || "?") + " | " + v.shipType + " | " + (v.flag || "?") }));
  }, [vessels, globeMode]);

  // WEATHER: temperature dots
  const weatherPoints = useMemo(() => {
    if (globeMode !== "globe-cables") return []; // cables mode = weather mode
    return weatherCities.map((c: WeatherCity) => {
      const color = c.isExtreme ? "#ff4757" : c.temperature > 35 ? "#ff9f43" : c.temperature > 20 ? "#ffd000" : c.temperature > 5 ? "#00e5ff" : c.temperature > -10 ? "#8a5cf6" : "#ffffff";
      return {
        lat: c.lat, lng: c.lng,
        size: c.isExtreme ? 0.6 : 0.3,
        color,
        label: `${c.city}, ${c.country} | ${c.temperature}°C | ${c.weatherLabel} | Wind ${c.windSpeed} km/h`,
      };
    });
  }, [weatherCities, globeMode]);

  const weatherRings = useMemo(() => {
    if (globeMode !== "globe-cables") return [];
    return weatherCities
      .filter((c: WeatherCity) => c.isExtreme)
      .map((c: WeatherCity) => ({ lat: c.lat, lng: c.lng, maxR: 5, propagationSpeed: 2, repeatPeriod: 2000 }));
  }, [weatherCities, globeMode]);

  const pointsData = useMemo(() => {
    let base: Array<{ lat: number; lng: number; size: number; color: string; label: string; item?: IntelItem }>;
    switch (globeMode) {
      case "globe-flights": base = flightPoints; break;
      case "globe-ships": base = shipPoints; break;
      case "globe-cables": base = weatherPoints; break;
      default: base = intelPoints; break;
    }
    // Merge enabled overlay layers on top of base mode data
    const overlays = [
      ...firePoints,
      ...satellitePoints,
      ...darkVesselPoints,
    ];
    return overlays.length > 0 ? [...base, ...overlays] : base;
  }, [globeMode, intelPoints, flightPoints, shipPoints, weatherPoints, firePoints, satellitePoints, darkVesselPoints]);

  const overlayCount = firePoints.length + satellitePoints.length + darkVesselPoints.length;
  const modeInfo = useMemo(() => {
    const suffix = overlayCount > 0 ? ` + ${overlayCount} OVERLAY` : "";
    switch (globeMode) {
      case "globe-intel": return { label: geoItems.length + " EVENTS" + suffix, color: "#00e5ff" };
      case "globe-flights": return { label: flightPoints.length + " AIRCRAFT" + suffix, color: "#ffd000" };
      case "globe-ships": return { label: shipPoints.length + " VESSELS" + suffix, color: "#00ff88" };
      case "globe-cables": return { label: weatherPoints.length + " WEATHER STATIONS" + suffix, color: "#ff9f43" };
      default: return { label: overlayCount > 0 ? overlayCount + " OVERLAY POINTS" : "", color: "#00e5ff" };
    }
  }, [globeMode, geoItems.length, flightPoints.length, shipPoints.length, overlayCount]);

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
    <div ref={containerRef} className="w-full h-full relative bg-black" role="img" aria-label="Interactive 3D globe showing global intelligence events, flight paths, and vessel positions">
      <Globe ref={globeRef} width={dimensions.w} height={dimensions.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor={modeInfo.color} atmosphereAltitude={0.15}
        pointsData={pointsData} pointLat="lat" pointLng="lng" pointAltitude={0.01} pointRadius="size" pointColor="color" pointLabel="label" pointsMerge={false}
        onPointClick={(point: object) => { const p = point as { item?: IntelItem }; if (p.item && onEventClick) onEventClick(p.item); }}
        ringsData={globeMode === "globe-cables" ? weatherRings : intelRings} ringLat="lat" ringLng="lng" ringMaxRadius="maxR" ringPropagationSpeed="propagationSpeed" ringRepeatPeriod="repeatPeriod" ringColor={() => "#ff475760"}
        arcsData={flightArc} arcStartLat="startLat" arcStartLng="startLng" arcEndLat="endLat" arcEndLng="endLng" arcColor="color" arcDashLength={0.4} arcDashGap={0.2} arcDashAnimateTime={1500} arcStroke={1.5}
        animateIn={true} waitForGlobeReady={true}
      />

      {globeMode === "globe-flights" && <FlightSearch onResult={handleFlightResult} />}

      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-hud-panel/80 backdrop-blur-sm border border-hud-border rounded px-2.5 py-1.5">
          <span className="font-mono text-[8px] font-bold tracking-wider" style={{ color: modeInfo.color }}>{modeInfo.label}</span>
        </div>
      </div>

      {globeMode === "globe-intel" && (
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
      )}
    </div>
  );
}
