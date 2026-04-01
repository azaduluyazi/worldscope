"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Map, { NavigationControl, Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { HeatmapLayer, CircleLayer } from "mapbox-gl";
import { MapHUD } from "./MapHUD";
import { ThreatIndex } from "./ThreatIndex";
import { FinanceOverlay } from "./FinanceOverlay";
import { TimelineSlider } from "./TimelineSlider";
import { useTimelineData } from "@/hooks/useTimelineData";
import { MAP_STYLE, VARIANT_MAP_VIEWS, VARIANT_FLY_TO } from "@/config/map-layers";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { useFlightTracker } from "@/hooks/useFlightTracker";
import { useVesselTracker } from "@/hooks/useVesselTracker";
import { getGPSJammingZones } from "@/lib/api/gps-jamming";
import { getSubmarineCables } from "@/lib/api/submarine-cables";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem, Category } from "@/types/intel";
import type { MapFilters } from "@/types/geo";
import { getVariantCategories, VARIANTS, type VariantId } from "@/config/variants";
import { timeAgo } from "@/lib/utils/date";
import "mapbox-gl/dist/mapbox-gl.css";

/* ══════════════════════════════════════════════════════════════
   FAZ 11 — Advanced Map: Custom markers, auto-rotate, glow clusters
   ══════════════════════════════════════════════════════════════ */

/* ── Severity → numeric weight for heatmap intensity ── */
const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 1.0, high: 0.75, medium: 0.5, low: 0.25, info: 0.1,
};

const SEVERITY_SIZE: Record<string, number> = {
  critical: 18, high: 13, medium: 10, low: 7, info: 5,
};

/* ── Custom SVG marker shapes per category ── */
const CATEGORY_SHAPES: Record<Category, (color: string, size: number) => React.ReactNode> = {
  conflict: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,20 2,20" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  cyber: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,1 22.4,6.5 22.4,17.5 12,23 1.6,17.5 1.6,6.5" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  aviation: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,1 23,12 12,23 1,12" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  natural: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" fill={`${color}40`} />
    </svg>
  ),
  finance: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="3" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
      <line x1="7" y1="17" x2="7" y2="10" stroke={`${color}40`} strokeWidth="2" />
      <line x1="12" y1="17" x2="12" y2="6" stroke={`${color}40`} strokeWidth="2" />
      <line x1="17" y1="17" x2="17" y2="12" stroke={`${color}40`} strokeWidth="2" />
    </svg>
  ),
  energy: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="13,1 4,14 11,14 11,23 20,10 13,10" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  tech: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill={`${color}40`} stroke={color} strokeWidth="1" />
    </svg>
  ),
  diplomacy: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L15 8 L22 9 L17 14 L18.5 21 L12 17.5 L5.5 21 L7 14 L2 9 L9 8 Z" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  protest: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,1 15,8 23,8 17,13 19,21 12,17 5,21 7,13 1,8 9,8" fill={`${color}cc`} stroke={color} strokeWidth="1" />
    </svg>
  ),
  health: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="2" width="8" height="20" rx="2" fill={`${color}cc`} />
      <rect x="2" y="8" width="20" height="8" rx="2" fill={`${color}cc`} />
      <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  sports: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
      <path d="M12 2 C12 2 16 8 16 12 C16 16 12 22 12 22" fill="none" stroke={`${color}40`} strokeWidth="1.5" />
      <path d="M12 2 C12 2 8 8 8 12 C8 16 12 22 12 22" fill="none" stroke={`${color}40`} strokeWidth="1.5" />
      <line x1="2" y1="12" x2="22" y2="12" stroke={`${color}40`} strokeWidth="1.5" />
    </svg>
  ),
};

/* ── Mapbox heatmap layer style ── */
const heatmapLayerStyle: HeatmapLayer = {
  id: "intel-heatmap",
  type: "heatmap",
  source: "intel-events",
  maxzoom: 9,
  paint: {
    "heatmap-weight": ["get", "weight"],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.6, 9, 3],
    "heatmap-color": [
      "interpolate", ["linear"], ["heatmap-density"],
      0, "rgba(0,0,0,0)",
      0.1, "rgba(0,229,255,0.15)",
      0.3, "rgba(0,229,255,0.4)",
      0.5, "rgba(255,208,0,0.5)",
      0.7, "rgba(255,71,87,0.7)",
      1.0, "rgba(255,71,87,0.9)",
    ],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 15, 5, 30, 9, 50],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.8, 9, 0],
  },
};

/* ── Cluster circle layer ── */
const clusterCircleStyle: CircleLayer = {
  id: "cluster-circles",
  type: "circle",
  source: "intel-clusters",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step", ["get", "point_count"],
      "#00e5ff", 10, "#ffd000", 30, "#ff4757",
    ],
    "circle-radius": [
      "step", ["get", "point_count"],
      16, 10, 22, 30, 30,
    ],
    "circle-opacity": 0.75,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#0a1530",
  },
};

/* ── Cluster GLOW outer ring — creates depth & energy feel ── */
const clusterGlowStyle: CircleLayer = {
  id: "cluster-glow",
  type: "circle",
  source: "intel-clusters",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": "transparent",
    "circle-radius": [
      "step", ["get", "point_count"],
      24, 10, 32, 30, 42,
    ],
    "circle-opacity": 0.6,
    "circle-stroke-width": 3,
    "circle-stroke-color": [
      "step", ["get", "point_count"],
      "#00e5ff", 10, "#ffd000", 30, "#ff4757",
    ],
    "circle-stroke-opacity": 0.25,
  },
};

/* ── Unclustered point glow ── */
const unclusteredGlowStyle: CircleLayer = {
  id: "unclustered-glow",
  type: "circle",
  source: "intel-clusters",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "transparent",
    "circle-radius": ["*", ["get", "radius"], 2.2],
    "circle-stroke-width": 2,
    "circle-stroke-color": ["get", "color"],
    "circle-stroke-opacity": 0.2,
  },
};

/* ── Cluster count text layer ── */
const clusterCountStyle = {
  id: "cluster-count",
  type: "symbol" as const,
  source: "intel-clusters",
  filter: ["has", "point_count"] as ["has", string],
  layout: {
    "text-field": ["get", "point_count_abbreviated"] as ["get", string],
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"] as [string, string],
    "text-size": 11,
  },
  paint: {
    "text-color": "#050a12",
  },
};

/* ── Unclustered point layer ── */
const unclusteredPointStyle: CircleLayer = {
  id: "unclustered-point",
  type: "circle",
  source: "intel-clusters",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": ["get", "color"],
    "circle-radius": ["get", "radius"],
    "circle-opacity": 0.85,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": ["get", "color"],
    "circle-stroke-opacity": 0.4,
  },
};

/* ── Auto-rotate config ── */
const AUTO_ROTATE_IDLE_MS = 15000; // 15s idle → start rotating
const AUTO_ROTATE_SPEED = 0.03;    // degrees per frame

interface TacticalMapProps {
  filters: MapFilters;
  variant?: VariantId;
}

interface RippleEvent {
  id: string;
  lat: number;
  lng: number;
  color: string;
  createdAt: number;
}

const RIPPLE_DURATION = 2500;

export function TacticalMap({ filters, variant = "world" }: TacticalMapProps) {
  const { items: allItems } = useIntelFeed();
  const { aircraft } = useFlightTracker();
  const { vessels } = useVesselTracker();
  const jammingZones = useMemo(() => getGPSJammingZones(), []);
  const cables = useMemo(() => getSubmarineCables(), []);
  const mapRef = useRef<MapRef>(null);
  const variantConfig = VARIANTS[variant];
  const accentColor = variantConfig.accent;
  const [viewState, setViewState] = useState(VARIANT_MAP_VIEWS[variant]);
  const [selectedEvent, setSelectedEvent] = useState<IntelItem | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const prevItemCountRef = useRef(0);

  // ── Timeline scrub state ──
  const [timelineActive, setTimelineActive] = useState(false);

  // ── 3D Terrain state ──
  const [terrain3D, setTerrain3D] = useState(false);

  // ── Auto-rotate state ──
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const lastInteractionRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Initialize lastInteraction timestamp on mount
  useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  // ── Reset idle timer on user interaction ──
  const handleUserInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (isAutoRotating) {
      setIsAutoRotating(false);
    }
  }, [isAutoRotating]);

  // ── Auto-rotate loop ──
  useEffect(() => {
    if (!mapLoaded) return;

    const checkIdle = () => {
      const elapsed = Date.now() - lastInteractionRef.current;
      if (elapsed >= AUTO_ROTATE_IDLE_MS && !isAutoRotating) {
        setIsAutoRotating(true);
      }
    };

    const idleChecker = setInterval(checkIdle, 2000);

    return () => clearInterval(idleChecker);
  }, [mapLoaded, isAutoRotating]);

  useEffect(() => {
    if (!isAutoRotating || !mapRef.current) return;

    let bearing = viewState.bearing || 0;

    const rotate = () => {
      bearing += AUTO_ROTATE_SPEED;
      if (bearing > 360) bearing -= 360;

      const map = mapRef.current?.getMap();
      if (map) {
        map.setBearing(bearing);
      }
      rafRef.current = requestAnimationFrame(rotate);
    };

    rafRef.current = requestAnimationFrame(rotate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isAutoRotating]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter items by variant categories (like IntelFeed does) ──
  const items = useMemo(() => {
    if (variant === "world") return allItems;
    const { all } = getVariantCategories(variant);
    return allItems.filter((item) => all.has(item.category as Category));
  }, [allItems, variant]);

  // ── Timeline hook — bins items for 48h scrubbing ──
  const timeline = useTimelineData({ items });

  // ── Detect new events → trigger ripple ──
  useEffect(() => {
    if (prevItemCountRef.current === 0) {
      prevItemCountRef.current = items.length;
      return;
    }

    const newCount = items.length - prevItemCountRef.current;
    if (newCount > 0) {
      const newItems = items.slice(0, newCount);
      const newRipples: RippleEvent[] = newItems
        .filter((i) => i.lat != null && i.lng != null)
        .map((i) => ({
          id: `ripple-${i.id}-${Date.now()}`,
          lat: i.lat!,
          lng: i.lng!,
          color: SEVERITY_COLORS[i.severity] || accentColor,
          createdAt: Date.now(),
        }));

      if (newRipples.length > 0) {
        setRipples((prev) => [...prev, ...newRipples]);
      }
    }
    prevItemCountRef.current = items.length;
  }, [items, accentColor]);

  // ── Clean up expired ripples ──
  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setRipples((prev) => prev.filter((r) => now - r.createdAt < RIPPLE_DURATION));
    }, RIPPLE_DURATION);
    return () => clearTimeout(timer);
  }, [ripples]);

  // ── Resolve source items: when timeline active, use current bin; otherwise all ──
  const sourceItems = useMemo(() => {
    if (!timelineActive) return items;
    const bin = timeline.bins[timeline.currentBinIndex];
    return bin ? bin.items : [];
  }, [timelineActive, items, timeline.bins, timeline.currentBinIndex]);

  // ── Filter events by active filters ──
  const geoEvents = useMemo(() => {
    return sourceItems.filter(
      (item): item is IntelItem & { lat: number; lng: number } => {
        if (item.lat == null || item.lng == null) return false;
        if (filters.categories.size > 0 && !filters.categories.has(item.category)) return false;
        if (filters.severities.size > 0 && !filters.severities.has(item.severity)) return false;
        return true;
      }
    );
  }, [sourceItems, filters.categories, filters.severities]);

  // ── GeoJSON for heatmap ──
  const heatmapGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: geoEvents.map((e) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [e.lng, e.lat] },
      properties: {
        weight: SEVERITY_WEIGHT[e.severity] || 0.3,
        severity: e.severity,
        category: e.category,
      },
    })),
  }), [geoEvents]);

  // ── GeoJSON for clusters ──
  const clusterGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: geoEvents.map((e) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [e.lng, e.lat] },
      properties: {
        id: e.id,
        title: e.title,
        severity: e.severity,
        category: e.category,
        color: SEVERITY_COLORS[e.severity] || "#5a7a9a",
        radius: SEVERITY_SIZE[e.severity] || 6,
      },
    })),
  }), [geoEvents]);

  // ── Smooth globe spin on load — variant-specific destination ──
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!mapLoaded || hasFitted.current) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const flyTo = VARIANT_FLY_TO[variant];
    map.flyTo({
      center: flyTo.center,
      zoom: flyTo.zoom,
      pitch: flyTo.pitch,
      bearing: flyTo.bearing,
      duration: 4000,
      essential: true,
    });
    hasFitted.current = true;
  }, [mapLoaded, variant]);

  // ── Marker click → flyTo + popup ──
  const handleMarkerClick = useCallback((event: IntelItem & { lat: number; lng: number }) => {
    handleUserInteraction();
    setSelectedEvent(event);
    mapRef.current?.getMap()?.flyTo({
      center: [event.lng, event.lat],
      zoom: Math.max(viewState.zoom, 4),
      duration: 1200,
      pitch: 45,
    });
  }, [viewState.zoom, handleUserInteraction]);

  // ── Click on cluster → zoom in ──
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    handleUserInteraction();
    const map = mapRef.current?.getMap();
    if (!map) return;

    const features = map.queryRenderedFeatures(e.point, { layers: ["cluster-circles"] });
    if (features.length > 0) {
      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource("intel-clusters") as mapboxgl.GeoJSONSource;
      if (source && clusterId != null) {
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          const coords = (features[0].geometry as GeoJSON.Point).coordinates;
          map.flyTo({ center: [coords[0], coords[1]], zoom: zoom + 0.5, duration: 800 });
        });
      }
      return;
    }

    const pointFeatures = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
    if (pointFeatures.length > 0) {
      const props = pointFeatures[0].properties;
      if (props?.id) {
        const item = geoEvents.find((ev) => ev.id === props.id);
        if (item) {
          handleMarkerClick(item);
          return;
        }
      }
    }

    setSelectedEvent(null);
  }, [geoEvents, handleMarkerClick, handleUserInteraction]);

  const showDomMarkers = !filters.clusters && !filters.heatmap;

  return (
    <div className="relative w-full h-full bg-hud-base overflow-hidden" role="application" aria-label="Interactive tactical map showing real-time global events">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => {
          setViewState(evt.viewState);
          handleUserInteraction();
        }}
        onClick={handleMapClick}
        onLoad={() => setMapLoaded(true)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        projection="globe"
        interactiveLayerIds={filters.clusters ? ["cluster-circles", "unclustered-point"] : []}
        terrain={terrain3D ? { source: "mapbox-dem", exaggeration: 1.5 } : undefined}
        fog={{
          color: "#050a12",
          "high-color": "#0a1a3a",
          "horizon-blend": 0.05,
          "space-color": "#020408",
          "star-intensity": 0.8,
        }}
      >
        <NavigationControl position="bottom-right" showCompass visualizePitch />

        {/* ── 3D Terrain: DEM source, sky, buildings ── */}
        <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />
        {terrain3D && (
          <>
            <Layer
              id="sky"
              type="sky"
              paint={{
                "sky-type": "atmosphere",
                "sky-atmosphere-sun": [0.0, 0.0],
                "sky-atmosphere-sun-intensity": 15,
              }}
            />
            <Layer
              id="3d-buildings"
              type="fill-extrusion"
              source="composite"
              source-layer="building"
              minzoom={12}
              filter={["==", "extrude", "true"]}
              paint={{
                "fill-extrusion-color": "#0a1a3a",
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.7,
              }}
            />
          </>
        )}

        {/* ── Finance Overlay — exchanges, banks, hubs (Finance variant only) ── */}
        {variant === "finance" && <FinanceOverlay />}

        {/* ── Heatmap Layer ── */}
        {filters.heatmap && (
          <Source id="intel-events" type="geojson" data={heatmapGeoJSON}>
            <Layer {...heatmapLayerStyle} />
          </Source>
        )}

        {/* ── Cluster Layers with Glow ── */}
        {filters.clusters && (
          <Source
            id="intel-clusters"
            type="geojson"
            data={clusterGeoJSON}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            {/* Glow rings (behind everything) */}
            <Layer {...clusterGlowStyle} />
            <Layer {...unclusteredGlowStyle} />
            {/* Main circles */}
            <Layer {...clusterCircleStyle} />
            <Layer {...clusterCountStyle} />
            <Layer {...unclusteredPointStyle} />
          </Source>
        )}

        {/* ── Custom SVG Category Markers (when clusters off) ── */}
        {showDomMarkers && geoEvents.map((event) => {
          const size = SEVERITY_SIZE[event.severity] || 8;
          const color = SEVERITY_COLORS[event.severity] || "#5a7a9a";
          const shouldPulse = event.severity === "critical" || event.severity === "high";
          const isSelected = selectedEvent?.id === event.id;
          const shapeRenderer = CATEGORY_SHAPES[event.category];

          return (
            <Marker
              key={event.id}
              latitude={event.lat}
              longitude={event.lng}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(event);
              }}
            >
              <div
                className="cursor-pointer relative transition-transform duration-200"
                title={`${CATEGORY_ICONS[event.category]} ${event.title}`}
                style={{ transform: isSelected ? "scale(1.5)" : "scale(1)" }}
              >
                {/* Pulse ring for critical/high */}
                {shouldPulse && (
                  <div
                    className="absolute rounded-full animate-ping"
                    style={{
                      width: size * 2.5,
                      height: size * 2.5,
                      backgroundColor: `${color}20`,
                      border: `1px solid ${color}40`,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
                {/* Outer glow ring */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: size * 1.8,
                    height: size * 1.8,
                    backgroundColor: `${color}10`,
                    border: `1px solid ${color}30`,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
                {/* Category SVG shape */}
                <div
                  className="relative z-10 flex items-center justify-center"
                  style={{
                    filter: `drop-shadow(0 0 ${size / 2}px ${color}80)`,
                  }}
                >
                  {shapeRenderer ? shapeRenderer(color, size) : (
                    <div
                      className="rounded-full border"
                      style={{
                        width: size,
                        height: size,
                        backgroundColor: `${color}cc`,
                        borderColor: color,
                        boxShadow: `0 0 ${size}px ${color}80`,
                      }}
                    />
                  )}
                </div>
              </div>
            </Marker>
          );
        })}

        {/* ── Aircraft Markers (ADS-B) ── */}
        {/* Aircraft always visible — real-time ADS-B data from adsb.lol */}
        {aircraft.slice(0, 300).map((ac) => {
          if (!ac.latitude || !ac.longitude) return null;
          const isMilitary = ac.category === "military";
          const color = isMilitary ? "#ff4757" : "#8a5cf6";
          return (
            <Marker key={ac.icao24} latitude={ac.latitude} longitude={ac.longitude} anchor="center">
              <div title={`${ac.callsign || ac.icao24} | ${ac.originCountry} | ALT: ${ac.altitude ? Math.round(ac.altitude) + "m" : "?"} | ${ac.onGround ? "GROUND" : "AIRBORNE"}`}>
                <svg width={isMilitary ? 14 : 10} height={isMilitary ? 14 : 10} viewBox="0 0 24 24" fill="none"
                  style={{ transform: `rotate(${ac.heading || 0}deg)`, filter: `drop-shadow(0 0 4px ${color}80)` }}>
                  <path d="M12 2L8 10H3L2 12L8 14V20L6 22H18L16 20V14L22 12L21 10H16L12 2Z" fill={`${color}cc`} stroke={color} strokeWidth="1" />
                </svg>
              </div>
            </Marker>
          );
        })}

        {/* ── Vessel Markers (AIS) ── */}
        {/* Show when: vessels toggle ON, OR energy/conflict category active (shipping lanes) */}
        {(filters.categories.has("maritime") || filters.categories.has("energy") || filters.categories.has("conflict")) && vessels.slice(0, 100).map((v) => {
          if (!v.latitude || !v.longitude) return null;
          const isMilitary = v.shipType === "military";
          const color = isMilitary ? "#ff4757" : v.shipType === "tanker" ? "#ffd000" : "#00e5ff";
          return (
            <Marker key={v.mmsi} latitude={v.latitude} longitude={v.longitude} anchor="center">
              <div title={`${v.name} | ${v.shipType.toUpperCase()} | ${v.flag || "?"} | SPD: ${v.speed || "?"}kn | DEST: ${v.destination || "?"}`}>
                <svg width={isMilitary ? 16 : 12} height={isMilitary ? 16 : 12} viewBox="0 0 24 24" fill="none"
                  style={{ transform: `rotate(${v.heading || v.course || 0}deg)`, filter: `drop-shadow(0 0 4px ${color}80)` }}>
                  <polygon points="12,2 20,20 12,16 4,20" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
                </svg>
              </div>
            </Marker>
          );
        })}

        {/* ── GPS Jamming Zones ── */}
        {(filters.categories.has("cyber") || filters.categories.has("conflict")) && jammingZones.map((zone) => {
          const color = zone.severity === "high" ? "#ff4757" : zone.severity === "medium" ? "#ffd000" : "#00e5ff";
          return (
            <Marker key={zone.id} latitude={zone.lat} longitude={zone.lng} anchor="center">
              <div
                className="rounded-full border-2 border-dashed animate-pulse"
                style={{
                  width: Math.max(20, zone.radius_km / 10),
                  height: Math.max(20, zone.radius_km / 10),
                  borderColor: `${color}80`,
                  backgroundColor: `${color}15`,
                }}
                title={`⚠ GPS JAMMING: ${zone.region}\n${zone.description}`}
              />
            </Marker>
          );
        })}

        {/* ── Submarine Cable Landing Points ── */}
        {(filters.categories.has("infrastructure") || filters.categories.has("tech") || filters.categories.has("cyber")) && cables.map((cable) =>
          cable.landing_points.map((lp, i) => (
            <Marker key={`${cable.id}-${i}`} latitude={lp.lat} longitude={lp.lng} anchor="center">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#00e5ff", boxShadow: "0 0 6px #00e5ff60" }}
                title={`🔌 ${cable.name}\n${lp.name} | ${cable.length_km}km | RFS: ${cable.rfs}`}
              />
            </Marker>
          ))
        )}

        {/* ── Enhanced Popup — glass panel with severity border ── */}
        {selectedEvent && selectedEvent.lat && selectedEvent.lng && (
          <Popup
            latitude={selectedEvent.lat}
            longitude={selectedEvent.lng}
            anchor="bottom"
            onClose={() => setSelectedEvent(null)}
            closeButton={false}
            className="tactical-popup"
            maxWidth="320px"
            offset={20}
          >
            <div
              className="glass-panel rounded-md p-3 min-w-[260px]"
              style={{
                borderLeft: `3px solid ${SEVERITY_COLORS[selectedEvent.severity]}`,
                background: `linear-gradient(90deg, ${SEVERITY_COLORS[selectedEvent.severity]}08 0%, rgba(5,10,18,0.92) 30%)`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-mono text-[9px] font-bold tracking-wider flex items-center gap-1"
                  style={{ color: SEVERITY_COLORS[selectedEvent.severity] }}
                >
                  {CATEGORY_ICONS[selectedEvent.category]}{" "}
                  {selectedEvent.severity.toUpperCase()} — {selectedEvent.category.toUpperCase()}
                </span>
                <span className="font-mono text-[8px] text-hud-muted">
                  {timeAgo(selectedEvent.publishedAt)}
                </span>
              </div>

              <p className="text-[11px] text-hud-text leading-relaxed mb-2">
                {selectedEvent.title.slice(0, 150)}
              </p>

              {selectedEvent.summary && (
                <p className="text-[9px] text-hud-muted leading-relaxed mb-2">
                  {selectedEvent.summary.slice(0, 200)}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-hud-border">
                <span className="font-mono text-[7px] text-hud-muted">
                  {selectedEvent.source}
                </span>
                {selectedEvent.url && (
                  <a
                    href={selectedEvent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[8px] text-hud-accent hover:underline"
                  >
                    OPEN →
                  </a>
                )}
              </div>

              <div className="font-mono text-[7px] text-hud-muted mt-1 flex items-center gap-2">
                <span>{selectedEvent.lat.toFixed(4)}°, {selectedEvent.lng.toFixed(4)}°</span>
                {selectedEvent.countryCode && (
                  <span className="bg-hud-accent/10 border border-hud-accent/20 px-1 rounded text-hud-accent">
                    {selectedEvent.countryCode}
                  </span>
                )}
              </div>
            </div>
          </Popup>
        )}

        {/* ── Ripple animations for new events ── */}
        {ripples.map((ripple) => (
          <Marker
            key={ripple.id}
            latitude={ripple.lat}
            longitude={ripple.lng}
            anchor="center"
          >
            <div className="relative pointer-events-none">
              <div
                className="event-ripple"
                style={{
                  borderColor: ripple.color,
                  border: `2px solid ${ripple.color}`,
                  boxShadow: `0 0 12px ${ripple.color}60`,
                }}
              />
              <div
                className="event-ripple-inner"
                style={{
                  backgroundColor: `${ripple.color}30`,
                  border: `1px solid ${ripple.color}80`,
                }}
              />
            </div>
          </Marker>
        ))}
      </Map>

      {/* HUD Overlay */}
      <MapHUD
        eventCount={geoEvents.length}
        layerCount={filters.heatmap ? 1 : 0}
        totalLayers={2}
      />

      {/* Threat Index - top right */}
      <div className="absolute top-3 right-3 z-30 w-48">
        <ThreatIndex />
      </div>

      {/* Variant badge — top left when not world */}
      {variant !== "world" && (
        <div className="absolute top-3 left-3 z-30">
          <div
            className="flex items-center gap-1.5 bg-hud-surface/80 backdrop-blur-sm border rounded px-2 py-1"
            style={{ borderColor: `${accentColor}40` }}
          >
            <span className="text-xs">{variantConfig.icon}</span>
            <span className="font-mono text-[8px] font-bold tracking-wider" style={{ color: accentColor }}>
              {variantConfig.name.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Auto-rotate indicator */}
      {isAutoRotating && (
        <div className="absolute bottom-14 left-3 z-30 fade-slide-in">
          <div
            className="flex items-center gap-1.5 bg-hud-surface/80 backdrop-blur-sm border rounded px-2 py-1"
            style={{ borderColor: `${accentColor}30` }}
          >
            <div className="w-1.5 h-1.5 rounded-full live-glow" style={{ backgroundColor: accentColor }} />
            <span className="font-mono text-[7px] tracking-wider" style={{ color: accentColor }}>AUTO-ROTATE</span>
          </div>
        </div>
      )}

      {/* Event count overlay */}
      <div className="absolute bottom-3 left-3 z-30">
        <div className="font-mono text-[8px] text-hud-muted/60 tracking-wider">
          {geoEvents.length > 0 && (
            <span>
              <span style={{ color: accentColor, textShadow: `0 0 6px ${accentColor}4d` }}>
                {geoEvents.length}
              </span>{" "}
              events tracked
            </span>
          )}
        </div>
      </div>

      {/* Active filter badges */}
      {filters.categories.size > 0 && (
        <div className={`absolute ${variant !== "world" ? "top-12" : "top-3"} left-3 z-30 flex gap-1 flex-wrap max-w-[200px]`}>
          {[...filters.categories].map((cat) => (
            <span
              key={cat}
              className="font-mono text-[8px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}40`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
              }}
            >
              {cat.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* ── 3D Terrain toggle button ── */}
      <button
        type="button"
        onClick={() => {
          setTerrain3D((prev) => {
            const next = !prev;
            mapRef.current?.getMap()?.flyTo({
              pitch: next ? 60 : 35,
              duration: 1000,
            });
            return next;
          });
        }}
        className={`absolute bottom-3 right-28 z-30 flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono tracking-wider transition-all border backdrop-blur-sm ${
          terrain3D
            ? "bg-[#00e5ff15] border-[#00e5ff40] text-[#00e5ff]"
            : "bg-hud-surface/80 border-hud-border text-hud-muted hover:text-hud-accent hover:border-[#00e5ff30]"
        }`}
        title="Toggle 3D terrain, sky & buildings"
      >
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 12l10 5 10-5" />
          <path d="M2 17l10 5 10-5" />
        </svg>
        3D
      </button>

      {/* ── Timeline toggle button ── */}
      <button
        type="button"
        onClick={() => {
          setTimelineActive((prev) => {
            if (prev) timeline.pause();
            return !prev;
          });
        }}
        className={`absolute bottom-3 right-14 z-30 flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono tracking-wider transition-all border backdrop-blur-sm ${
          timelineActive
            ? "bg-[#00e5ff15] border-[#00e5ff40] text-[#00e5ff]"
            : "bg-hud-surface/80 border-hud-border text-hud-muted hover:text-hud-accent hover:border-[#00e5ff30]"
        }`}
        title="Toggle 48h timeline scrubber"
      >
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        TIMELINE
      </button>

      {/* ── Timeline Slider (absolute bottom of map) ── */}
      {timelineActive && (
        <div className="absolute bottom-8 left-3 right-3 z-30 bg-hud-surface/90 backdrop-blur-sm border border-hud-border rounded px-1 py-1">
          <TimelineSlider
            bins={timeline.bins}
            currentIndex={timeline.currentBinIndex}
            onChange={timeline.setCurrentBinIndex}
            isPlaying={timeline.isPlaying}
            onPlay={timeline.play}
            onPause={timeline.pause}
          />
        </div>
      )}
    </div>
  );
}
