"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Map, { NavigationControl, Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { HeatmapLayer, CircleLayer } from "mapbox-gl";
import { MapHUD } from "./MapHUD";
import { ThreatIndex } from "./ThreatIndex";
import { MAP_STYLE, MAP_INITIAL_VIEW } from "@/config/map-layers";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import type { MapFilters } from "@/types/geo";
import { timeAgo } from "@/lib/utils/date";
import "mapbox-gl/dist/mapbox-gl.css";

/* ── Severity → numeric weight for heatmap intensity ── */
const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 1.0, high: 0.75, medium: 0.5, low: 0.25, info: 0.1,
};

const SEVERITY_SIZE: Record<string, number> = {
  critical: 18, high: 13, medium: 10, low: 7, info: 5,
};

/* ── Mapbox heatmap layer style ── */
const heatmapLayerStyle: HeatmapLayer = {
  id: "intel-heatmap",
  type: "heatmap",
  source: "intel-events",
  maxzoom: 9,
  paint: {
    // Weight by severity
    "heatmap-weight": ["get", "weight"],
    // Intensity ramps with zoom
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.6, 9, 3],
    // Color ramp: transparent → cyan → yellow → red
    "heatmap-color": [
      "interpolate", ["linear"], ["heatmap-density"],
      0, "rgba(0,0,0,0)",
      0.1, "rgba(0,229,255,0.15)",  // cyan glow
      0.3, "rgba(0,229,255,0.4)",
      0.5, "rgba(255,208,0,0.5)",   // yellow
      0.7, "rgba(255,71,87,0.7)",   // red
      1.0, "rgba(255,71,87,0.9)",
    ],
    // Radius increases with zoom
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 15, 5, 30, 9, 50],
    // Fade out at high zoom to show markers
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
      "#00e5ff",  // < 10
      10, "#ffd000", // 10-30
      30, "#ff4757", // 30+
    ],
    "circle-radius": [
      "step", ["get", "point_count"],
      16,   // < 10
      10, 22, // 10-30
      30, 30, // 30+
    ],
    "circle-opacity": 0.75,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#0a1530",
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

/* ── Unclustered point layer (for cluster source) ── */
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

interface TacticalMapProps {
  filters: MapFilters;
}

/** Ripple marker for new event animation */
interface RippleEvent {
  id: string;
  lat: number;
  lng: number;
  color: string;
  createdAt: number;
}

const RIPPLE_DURATION = 2500; // ms

export function TacticalMap({ filters }: TacticalMapProps) {
  const { items } = useIntelFeed();
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState(MAP_INITIAL_VIEW);
  const [selectedEvent, setSelectedEvent] = useState<IntelItem | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const prevItemCountRef = useRef(0);

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
          color: SEVERITY_COLORS[i.severity] || "#00e5ff",
          createdAt: Date.now(),
        }));

      if (newRipples.length > 0) {
        setRipples((prev) => [...prev, ...newRipples]);
      }
    }
    prevItemCountRef.current = items.length;
  }, [items]);

  // ── Clean up expired ripples ──
  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setRipples((prev) => prev.filter((r) => now - r.createdAt < RIPPLE_DURATION));
    }, RIPPLE_DURATION);
    return () => clearTimeout(timer);
  }, [ripples]);

  // ── Filter events by active filters ──
  const geoEvents = useMemo(() => {
    return items.filter(
      (item): item is IntelItem & { lat: number; lng: number } => {
        if (item.lat == null || item.lng == null) return false;
        if (filters.categories.size > 0 && !filters.categories.has(item.category)) return false;
        if (filters.severities.size > 0 && !filters.severities.has(item.severity)) return false;
        return true;
      }
    );
  }, [items, filters.categories, filters.severities]);

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

  // ── Auto-fit to geo events when they first load ──
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!mapLoaded || hasFitted.current || geoEvents.length < 2) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const lngs = geoEvents.map((e) => e.lng);
    const lats = geoEvents.map((e) => e.lat);
    const sw: [number, number] = [Math.min(...lngs) - 5, Math.min(...lats) - 5];
    const ne: [number, number] = [Math.max(...lngs) + 5, Math.max(...lats) + 5];

    map.fitBounds([sw, ne], {
      padding: { top: 80, bottom: 80, left: 60, right: 380 },
      maxZoom: 5,
      duration: 3000,
      pitch: 40,
    });
    hasFitted.current = true;
  }, [geoEvents, mapLoaded]);

  // ── Marker click → flyTo + popup ──
  const handleMarkerClick = useCallback((event: IntelItem & { lat: number; lng: number }) => {
    setSelectedEvent(event);
    mapRef.current?.getMap()?.flyTo({
      center: [event.lng, event.lat],
      zoom: Math.max(viewState.zoom, 4),
      duration: 1200,
      pitch: 45,
    });
  }, [viewState.zoom]);

  // ── Click on cluster → zoom in ──
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Check if clicked on a cluster
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

    // Check if clicked on unclustered point
    const pointFeatures = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
    if (pointFeatures.length > 0) {
      const props = pointFeatures[0].properties;
      const coords = (pointFeatures[0].geometry as GeoJSON.Point).coordinates;
      if (props?.id) {
        const item = geoEvents.find((ev) => ev.id === props.id);
        if (item) {
          handleMarkerClick(item);
          return;
        }
      }
    }

    // Click on empty area → close popup
    setSelectedEvent(null);
  }, [geoEvents, handleMarkerClick]);

  // Should show individual DOM markers? Only when clusters are off
  const showDomMarkers = !filters.clusters && !filters.heatmap;

  return (
    <div className="relative w-full h-full bg-hud-base overflow-hidden">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onLoad={() => setMapLoaded(true)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        projection="globe"
        interactiveLayerIds={filters.clusters ? ["cluster-circles", "unclustered-point"] : []}
        fog={{
          color: "#050a12",
          "high-color": "#0a1530",
          "horizon-blend": 0.04,
          "space-color": "#020408",
          "star-intensity": 0.7,
        }}
      >
        <NavigationControl position="bottom-right" showCompass visualizePitch />

        {/* ── Heatmap Layer ── */}
        {filters.heatmap && (
          <Source id="intel-events" type="geojson" data={heatmapGeoJSON}>
            <Layer {...heatmapLayerStyle} />
          </Source>
        )}

        {/* ── Cluster Layer ── */}
        {filters.clusters && (
          <Source
            id="intel-clusters"
            type="geojson"
            data={clusterGeoJSON}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer {...clusterCircleStyle} />
            <Layer {...clusterCountStyle} />
            <Layer {...unclusteredPointStyle} />
          </Source>
        )}

        {/* ── Individual Markers (only when clusters off) ── */}
        {showDomMarkers && geoEvents.map((event) => {
          const size = SEVERITY_SIZE[event.severity] || 8;
          const color = SEVERITY_COLORS[event.severity] || "#5a7a9a";
          const shouldPulse = event.severity === "critical" || event.severity === "high";
          const isSelected = selectedEvent?.id === event.id;

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
                title={event.title}
                style={{ transform: isSelected ? "scale(1.5)" : "scale(1)" }}
              >
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
                <div
                  className="rounded-full border"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: `${color}cc`,
                    borderColor: color,
                    boxShadow: `0 0 ${size}px ${color}80, 0 0 ${size * 2}px ${color}30`,
                  }}
                />
              </div>
            </Marker>
          );
        })}

        {/* ── Popup for selected event ── */}
        {selectedEvent && selectedEvent.lat && selectedEvent.lng && (
          <Popup
            latitude={selectedEvent.lat}
            longitude={selectedEvent.lng}
            anchor="bottom"
            onClose={() => setSelectedEvent(null)}
            closeButton={false}
            className="tactical-popup"
            maxWidth="300px"
            offset={20}
          >
            <div className="bg-hud-panel border border-hud-border rounded-md p-3 min-w-[250px]">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-mono text-[9px] font-bold tracking-wider"
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

              <div className="font-mono text-[7px] text-hud-muted mt-1">
                {selectedEvent.lat.toFixed(4)}°, {selectedEvent.lng.toFixed(4)}°
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

      {/* Active filter badges */}
      {filters.categories.size > 0 && (
        <div className="absolute top-3 left-3 z-30 flex gap-1 flex-wrap max-w-[200px]">
          {[...filters.categories].map((cat) => (
            <span
              key={cat}
              className="font-mono text-[8px] bg-hud-accent/15 border border-hud-accent/30 text-hud-accent px-1.5 py-0.5 rounded"
            >
              {cat.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
