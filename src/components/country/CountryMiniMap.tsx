"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import Map, { NavigationControl, Source, Layer, Popup } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { CircleLayer } from "mapbox-gl";
import { MAP_STYLE } from "@/config/map-layers";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import type { CountryMeta } from "@/config/countries";
import { timeAgo } from "@/lib/utils/date";
import "mapbox-gl/dist/mapbox-gl.css";

const SEVERITY_SIZE: Record<string, number> = {
  critical: 12, high: 9, medium: 7, low: 5, info: 4,
};

const pointStyle: CircleLayer = {
  id: "country-points",
  type: "circle",
  source: "country-events",
  paint: {
    "circle-color": ["get", "color"],
    "circle-radius": ["get", "radius"],
    "circle-opacity": 0.85,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": ["get", "color"],
    "circle-stroke-opacity": 0.3,
  },
};

const glowStyle: CircleLayer = {
  id: "country-glow",
  type: "circle",
  source: "country-events",
  paint: {
    "circle-color": "transparent",
    "circle-radius": ["*", ["get", "radius"], 2],
    "circle-stroke-width": 2,
    "circle-stroke-color": ["get", "color"],
    "circle-stroke-opacity": 0.15,
  },
};

interface CountryMiniMapProps {
  country: CountryMeta;
  items: IntelItem[];
}

export function CountryMiniMap({ country, items }: CountryMiniMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<IntelItem | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const geoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: items
      .filter((i): i is IntelItem & { lat: number; lng: number } => i.lat != null && i.lng != null)
      .map((e) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [e.lng, e.lat] },
        properties: {
          id: e.id,
          color: SEVERITY_COLORS[e.severity] || "#5a7a9a",
          radius: SEVERITY_SIZE[e.severity] || 6,
        },
      })),
  }), [items]);

  // Fly to country on load
  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const timer = setTimeout(() => {
      map.flyTo({
        center: [country.lng, country.lat],
        zoom: country.zoom,
        pitch: 30,
        duration: 2000,
        essential: true,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [mapLoaded, country]);

  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const features = map.queryRenderedFeatures(e.point, { layers: ["country-points"] });
    if (features.length > 0) {
      const id = features[0].properties?.id;
      const item = items.find((i) => i.id === id);
      if (item) {
        setSelected(item);
        return;
      }
    }
    setSelected(null);
  }, [items]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-hud-border">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: country.lng,
          latitude: country.lat,
          zoom: Math.max(country.zoom - 1, 1),
          pitch: 20,
          bearing: 0,
        }}
        onLoad={() => setMapLoaded(true)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onClick={handleMapClick}
        interactiveLayerIds={["country-points"]}
        fog={{
          color: "#050a12",
          "high-color": "#0a1a3a",
          "horizon-blend": 0.05,
          "space-color": "#020408",
          "star-intensity": 0.6,
        }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        <Source id="country-events" type="geojson" data={geoJSON}>
          <Layer {...glowStyle} />
          <Layer {...pointStyle} />
        </Source>

        {selected && selected.lat && selected.lng && (
          <Popup
            latitude={selected.lat}
            longitude={selected.lng}
            anchor="bottom"
            onClose={() => setSelected(null)}
            closeButton={false}
            className="tactical-popup"
            maxWidth="280px"
            offset={12}
          >
            <div
              className="glass-panel rounded-md p-2.5 min-w-[220px]"
              style={{
                borderLeft: `3px solid ${SEVERITY_COLORS[selected.severity]}`,
                background: `linear-gradient(90deg, ${SEVERITY_COLORS[selected.severity]}08 0%, rgba(5,10,18,0.92) 30%)`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px]">{CATEGORY_ICONS[selected.category]}</span>
                <span
                  className="font-mono text-[8px] font-bold tracking-wider"
                  style={{ color: SEVERITY_COLORS[selected.severity] }}
                >
                  {selected.severity.toUpperCase()}
                </span>
                <span className="font-mono text-[7px] text-hud-muted ml-auto">
                  {timeAgo(selected.publishedAt)}
                </span>
              </div>
              <p className="text-[10px] text-hud-text leading-snug mb-1">
                {selected.title.slice(0, 120)}
              </p>
              {selected.url && (
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[7px] text-hud-accent hover:underline"
                >
                  OPEN →
                </a>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Event count badge */}
      <div className="absolute top-2 left-2 z-10">
        <div className="font-mono text-[8px] text-hud-muted bg-hud-surface/80 backdrop-blur-sm border border-hud-border rounded px-1.5 py-0.5">
          <span className="text-hud-accent">{geoJSON.features.length}</span> geo-located
        </div>
      </div>
    </div>
  );
}
