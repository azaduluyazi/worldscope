"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import Globe from "react-globe.gl";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { SEVERITY_COLORS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { VARIANTS, type VariantId } from "@/config/variants";

/* ── Severity → marker size ── */
const SEVERITY_SIZE: Record<string, number> = {
  critical: 1.2,
  high: 0.8,
  medium: 0.5,
  low: 0.3,
  info: 0.15,
};

/* ── Severity → ring animation speed ── */
const SEVERITY_RING_SPEED: Record<string, number> = {
  critical: 4,
  high: 2,
  medium: 1,
  low: 0,
  info: 0,
};

interface Globe3DProps {
  variant?: VariantId;
  onEventClick?: (item: IntelItem) => void;
}

export function Globe3D({ variant = "world", onEventClick }: Globe3DProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null); // Globe instance type not exported
  const { items } = useIntelFeed();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const variantConfig = VARIANTS[variant];

  // Filter geo-located items only
  const geoItems = useMemo(
    () => items.filter((item) => item.lat != null && item.lng != null),
    [items]
  );

  // Points data for globe markers
  const pointsData = useMemo(
    () =>
      geoItems.map((item) => ({
        lat: item.lat!,
        lng: item.lng!,
        size: SEVERITY_SIZE[item.severity] || 0.3,
        color: SEVERITY_COLORS[item.severity] || "#00e5ff",
        label: `${item.severity.toUpperCase()} — ${item.title.slice(0, 60)}`,
        item,
      })),
    [geoItems]
  );

  // Rings for critical/high events (animated ripple effect)
  const ringsData = useMemo(
    () =>
      geoItems
        .filter((item) => item.severity === "critical" || item.severity === "high")
        .map((item) => ({
          lat: item.lat!,
          lng: item.lng!,
          maxR: item.severity === "critical" ? 6 : 3,
          propagationSpeed: SEVERITY_RING_SPEED[item.severity] || 1,
          repeatPeriod: item.severity === "critical" ? 800 : 1200,
          color: SEVERITY_COLORS[item.severity],
        })),
    [geoItems]
  );

  // Arcs between events in the same category (visual connections)
  const arcsData = useMemo(() => {
    if (geoItems.length < 2) return [];
    const arcs: Array<{
      startLat: number;
      startLng: number;
      endLat: number;
      endLng: number;
      color: string;
    }> = [];

    // Connect critical events to show threat corridors
    const criticalItems = geoItems.filter((i) => i.severity === "critical");
    for (let i = 0; i < Math.min(criticalItems.length - 1, 5); i++) {
      const a = criticalItems[i];
      const b = criticalItems[i + 1];
      arcs.push({
        startLat: a.lat!,
        startLng: a.lng!,
        endLat: b.lat!,
        endLng: b.lng!,
        color: `${SEVERITY_COLORS.critical}80`,
      });
    }
    return arcs;
  }, [geoItems]);

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

  // Auto-rotate when idle
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


  return (
    <div ref={containerRef} className="w-full h-full relative">
      <Globe
        ref={globeRef}
        width={dimensions.w}
        height={dimensions.h}
        // Globe appearance
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor={variantConfig.accent}
        atmosphereAltitude={0.2}
        // Points (event markers)
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="size"
        pointRadius="size"
        pointColor="color"
        pointLabel="label"
        pointsMerge={false}
        onPointClick={(point: object) => { const p = point as { item?: IntelItem }; if (p.item && onEventClick) onEventClick(p.item); }}
        // Rings (critical event ripples)
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
        // Performance
        animateIn={true}
        waitForGlobeReady={true}
      />

      {/* HUD overlay */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-hud-panel/80 backdrop-blur-sm border border-hud-border rounded px-2 py-1">
          <span className="font-mono text-[8px] text-hud-accent tracking-wider">
            3D GLOBE — {geoItems.length} GEO-LOCATED EVENTS
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-hud-panel/80 backdrop-blur-sm border border-hud-border rounded px-2 py-1.5 flex flex-col gap-0.5">
          {(["critical", "high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: SEVERITY_COLORS[sev] }}
              />
              <span className="font-mono text-[7px] text-hud-muted">
                {sev.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
