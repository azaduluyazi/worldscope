"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import Globe from "react-globe.gl";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { useFlightTracker } from "@/hooks/useFlightTracker";
import { useVesselTracker } from "@/hooks/useVesselTracker";
import { SEVERITY_COLORS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { VARIANTS, type VariantId } from "@/config/variants";

/* ── Layer configuration ── */
interface GlobeLayers {
  intelEvents: boolean;
  conflictZones: boolean;
  flights: boolean;
  ships: boolean;
  weather: boolean;
  subCables: boolean;
}

const DEFAULT_LAYERS: GlobeLayers = {
  intelEvents: true,
  conflictZones: true,
  flights: false,
  ships: false,
  weather: false,
  subCables: false,
};

/* ── Severity → marker size ── */
const SEVERITY_SIZE: Record<string, number> = {
  critical: 1.2, high: 0.8, medium: 0.5, low: 0.3, info: 0.15,
};

interface Globe3DProps {
  variant?: VariantId;
  onEventClick?: (item: IntelItem) => void;
}

export function Globe3D({ variant = "world", onEventClick }: Globe3DProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const { items } = useIntelFeed();
  const { aircraft } = useFlightTracker();
  const { vessels } = useVesselTracker();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [layers, setLayers] = useState<GlobeLayers>(DEFAULT_LAYERS);
  const containerRef = useRef<HTMLDivElement>(null);
  const variantConfig = VARIANTS[variant];

  const toggleLayer = (key: keyof GlobeLayers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter geo-located intel items
  const geoItems = useMemo(
    () => items.filter((item) => item.lat != null && item.lng != null),
    [items]
  );

  // ── LAYER DATA: Intel event markers ──
  const pointsData = useMemo(() => {
    if (!layers.intelEvents) return [];
    return geoItems.map((item) => ({
      lat: item.lat!,
      lng: item.lng!,
      size: SEVERITY_SIZE[item.severity] || 0.3,
      color: SEVERITY_COLORS[item.severity] || "#00e5ff",
      label: `${item.severity.toUpperCase()} — ${item.title.slice(0, 60)}`,
      item,
    }));
  }, [geoItems, layers.intelEvents]);

  // ── LAYER DATA: Conflict zone rings ──
  const ringsData = useMemo(() => {
    if (!layers.conflictZones) return [];
    return geoItems
      .filter((item) => item.severity === "critical" || item.severity === "high")
      .map((item) => ({
        lat: item.lat!,
        lng: item.lng!,
        maxR: item.severity === "critical" ? 6 : 3,
        propagationSpeed: item.severity === "critical" ? 4 : 2,
        repeatPeriod: item.severity === "critical" ? 800 : 1200,
      }));
  }, [geoItems, layers.conflictZones]);

  // ── LAYER DATA: Flight positions ──
  const flightArcsData = useMemo(() => {
    if (!layers.flights || !aircraft?.length) return [];
    return aircraft
      .filter((f) => f.latitude != null && f.longitude != null)
      .slice(0, 100)
      .map((f) => ({
        lat: f.latitude!,
        lng: f.longitude!,
        size: 0.3,
        color: f.category === "military" ? "#ff4757" : "#ffd000",
        label: `${f.callsign || "Unknown"} | ALT: ${f.altitude || "?"}m | ${f.originCountry}`,
      }));
  }, [aircraft, layers.flights]);

  // ── LAYER DATA: Ship positions ──
  const shipPointsData = useMemo(() => {
    if (!layers.ships || !vessels?.length) return [];
    return vessels
      .slice(0, 80)
      .map((v) => ({
        lat: v.latitude,
        lng: v.longitude,
        size: 0.4,
        color: "#00ff88",
        label: `${v.name || "Unknown"} | ${v.shipType || "Vessel"} | ${v.flag || "?"}`,
      }));
  }, [vessels, layers.ships]);

  // Combine all point data
  const allPointsData = useMemo(
    () => [...pointsData, ...flightArcsData, ...shipPointsData],
    [pointsData, flightArcsData, shipPointsData]
  );

  // Threat corridor arcs (critical events connected)
  const arcsData = useMemo(() => {
    if (!layers.conflictZones) return [];
    const criticalItems = geoItems.filter((i) => i.severity === "critical");
    if (criticalItems.length < 2) return [];
    const arcs: Array<{
      startLat: number; startLng: number;
      endLat: number; endLng: number;
      color: string;
    }> = [];
    for (let i = 0; i < Math.min(criticalItems.length - 1, 5); i++) {
      arcs.push({
        startLat: criticalItems[i].lat!,
        startLng: criticalItems[i].lng!,
        endLat: criticalItems[i + 1].lat!,
        endLng: criticalItems[i + 1].lng!,
        color: `${SEVERITY_COLORS.critical}80`,
      });
    }
    return arcs;
  }, [geoItems, layers.conflictZones]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ w: Math.round(width), h: Math.round(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Auto-rotate
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableDamping = true;
    }
  }, []);

  const LAYER_CONFIG: Array<{ key: keyof GlobeLayers; label: string; icon: string; color: string }> = [
    { key: "intelEvents", label: "INTEL", icon: "📡", color: "#00e5ff" },
    { key: "conflictZones", label: "CONFLICT", icon: "⚔️", color: "#ff4757" },
    { key: "flights", label: "FLIGHTS", icon: "✈️", color: "#ffd000" },
    { key: "ships", label: "SHIPS", icon: "🚢", color: "#00ff88" },
    { key: "weather", label: "WEATHER", icon: "🌦️", color: "#8a5cf6" },
    { key: "subCables", label: "CABLES", icon: "🔌", color: "#ff9f43" },
  ];

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <Globe
        ref={globeRef}
        width={dimensions.w}
        height={dimensions.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor={variantConfig.accent}
        atmosphereAltitude={0.15}
        // All points (intel + flights + ships)
        pointsData={allPointsData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="size"
        pointRadius="size"
        pointColor="color"
        pointLabel="label"
        pointsMerge={false}
        onPointClick={(point: object) => {
          const p = point as { item?: IntelItem };
          if (p.item && onEventClick) onEventClick(p.item);
        }}
        // Rings (conflict zone ripples)
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor={() => "#ff475780"}
        // Arcs (threat corridors)
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={0.5}
        animateIn={true}
        waitForGlobeReady={true}
      />

      {/* ── Layer Toggle Panel ── */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-hud-panel/90 backdrop-blur-sm border border-hud-border rounded-lg p-2 min-w-[140px]">
          <div className="font-mono text-[7px] text-hud-muted tracking-wider mb-1.5 pb-1 border-b border-hud-border">
            LAYERS
          </div>
          <div className="flex flex-col gap-0.5">
            {LAYER_CONFIG.map(({ key, label, icon, color }) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-left transition-all ${
                  layers[key]
                    ? "bg-white/5 border border-white/10"
                    : "opacity-40 hover:opacity-70 border border-transparent"
                }`}
              >
                <span className="text-[9px]">{icon}</span>
                <span
                  className="font-mono text-[7px] tracking-wider"
                  style={{ color: layers[key] ? color : "#666" }}
                >
                  {label}
                </span>
                {layers[key] && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats HUD ── */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-hud-panel/80 backdrop-blur-sm border border-hud-border rounded px-2 py-1.5">
          <div className="font-mono text-[7px] text-hud-muted tracking-wider mb-1">STATUS</div>
          <div className="flex flex-col gap-0.5">
            {layers.intelEvents && (
              <span className="font-mono text-[7px] text-hud-accent">
                {geoItems.length} EVENTS
              </span>
            )}
            {layers.flights && (
              <span className="font-mono text-[7px] text-[#ffd000]">
                {flightArcsData.length} AIRCRAFT
              </span>
            )}
            {layers.ships && (
              <span className="font-mono text-[7px] text-[#00ff88]">
                {shipPointsData.length} VESSELS
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Severity Legend ── */}
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
