"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import Globe from "react-globe.gl";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { useFlightTracker } from "@/hooks/useFlightTracker";
import { useVesselTracker } from "@/hooks/useVesselTracker";
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
}

export function Globe3D({ variant = "world", onEventClick, globeMode = "globe-intel" }: Globe3DProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const { items } = useIntelFeed();
  const { aircraft } = useFlightTracker();
  const { vessels } = useVesselTracker();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const variantConfig = VARIANTS[variant];
  const [searchedFlight, setSearchedFlight] = useState<FlightSearchResult | null>(null);
  const handleFlightResult = useCallback((r: FlightSearchResult | null) => setSearchedFlight(r), []);

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

  const pointsData = useMemo(() => {
    switch (globeMode) {
      case "globe-flights": return flightPoints;
      case "globe-ships": return shipPoints;
      default: return intelPoints;
    }
  }, [globeMode, intelPoints, flightPoints, shipPoints]);

  const modeInfo = useMemo(() => {
    switch (globeMode) {
      case "globe-intel": return { label: geoItems.length + " EVENTS", color: "#00e5ff" };
      case "globe-flights": return { label: flightPoints.length + " AIRCRAFT", color: "#ffd000" };
      case "globe-ships": return { label: shipPoints.length + " VESSELS", color: "#00ff88" };
      case "globe-cables": return { label: "SUBMARINE CABLES", color: "#ff9f43" };
      default: return { label: "", color: "#00e5ff" };
    }
  }, [globeMode, geoItems.length, flightPoints.length, shipPoints.length]);

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
    <div ref={containerRef} className="w-full h-full relative bg-black">
      <Globe ref={globeRef} width={dimensions.w} height={dimensions.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor={modeInfo.color} atmosphereAltitude={0.15}
        pointsData={pointsData} pointLat="lat" pointLng="lng" pointAltitude={0.01} pointRadius="size" pointColor="color" pointLabel="label" pointsMerge={false}
        onPointClick={(point: object) => { const p = point as { item?: IntelItem }; if (p.item && onEventClick) onEventClick(p.item); }}
        ringsData={intelRings} ringLat="lat" ringLng="lng" ringMaxRadius="maxR" ringPropagationSpeed="propagationSpeed" ringRepeatPeriod="repeatPeriod" ringColor={() => "#ff475760"}
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
