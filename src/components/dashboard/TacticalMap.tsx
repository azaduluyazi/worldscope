"use client";

import { useState } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import { MapHUD } from "./MapHUD";
import { MAP_STYLE, MAP_INITIAL_VIEW, DEFAULT_LAYERS } from "@/config/map-layers";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import "mapbox-gl/dist/mapbox-gl.css";

export function TacticalMap() {
  const { items } = useIntelFeed();
  const [viewState, setViewState] = useState(MAP_INITIAL_VIEW);

  const enabledLayers = DEFAULT_LAYERS.filter((l) => l.enabled);
  const geoEvents = items.filter((item) => item.lat && item.lng);

  return (
    <div className="relative w-full h-full bg-hud-base overflow-hidden">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
      </Map>

      <MapHUD
        eventCount={geoEvents.length}
        layerCount={enabledLayers.length}
        totalLayers={DEFAULT_LAYERS.length}
      />
    </div>
  );
}
