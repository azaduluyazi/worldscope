"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { loadGeoPoints, type GeoPoint } from "@/lib/geo/layer-loader";
import { DEFAULT_LAYERS } from "@/config/map-layers";

export interface GlobeOverlayPoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  label: string;
}

/**
 * External store for overlay data — avoids setState-in-effect ESLint issue.
 * Data is loaded imperatively, listeners notified via subscribe pattern.
 */
const overlayStore = {
  data: {} as Record<string, GlobeOverlayPoint[]>,
  listeners: new Set<() => void>(),
  pending: new Set<string>(),

  getSnapshot(): Record<string, GlobeOverlayPoint[]> {
    return overlayStore.data;
  },

  subscribe(listener: () => void): () => void {
    overlayStore.listeners.add(listener);
    return () => overlayStore.listeners.delete(listener);
  },

  notify(): void {
    for (const listener of overlayStore.listeners) listener();
  },

  setLayer(id: string, points: GlobeOverlayPoint[]): void {
    overlayStore.data = { ...overlayStore.data, [id]: points };
    overlayStore.notify();
  },

  removeLayer(id: string): void {
    if (!(id in overlayStore.data)) return;
    const next = { ...overlayStore.data };
    delete next[id];
    overlayStore.data = next;
    overlayStore.notify();
  },
};

const loadableLayers = DEFAULT_LAYERS.filter(
  (l) => l.sourceType === "static" || l.sourceType === "api"
);

async function fetchLayerData(layerId: string): Promise<void> {
  if (overlayStore.pending.has(layerId)) return;
  overlayStore.pending.add(layerId);

  const layer = loadableLayers.find((l) => l.id === layerId);
  if (!layer) { overlayStore.pending.delete(layerId); return; }

  try {
    let points: GlobeOverlayPoint[] = [];

    if (layer.sourceType === "static" && layer.sourceUrl) {
      const geoPoints = await loadGeoPoints(layer.sourceUrl, layer.maxPoints || 500);
      points = geoPoints.map((p: GeoPoint) => ({
        lat: p.lat,
        lng: p.lng,
        size: 0.15,
        color: layer.color,
        label: `${layer.icon} ${p.name || layer.label}`,
      }));
    } else if (layer.sourceType === "api" && layer.apiEndpoint) {
      const res = await fetch(layer.apiEndpoint);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data || [];
        points = (Array.isArray(items) ? items : [])
          .filter((i: Record<string, unknown>) => i.lat && i.lng)
          .slice(0, layer.maxPoints || 200)
          .map((i: Record<string, unknown>) => ({
            lat: Number(i.lat),
            lng: Number(i.lng),
            size: 0.15,
            color: layer.color,
            label: `${layer.icon} ${String(i.name || i.title || layer.label)}`,
          }));
      }
    }

    if (points.length > 0) {
      overlayStore.setLayer(layerId, points);
    }
  } catch {
    // Silently fail
  } finally {
    overlayStore.pending.delete(layerId);
  }
}

/**
 * Serializes a Set<string> to a stable string for use as useEffect dependency.
 */
function serializeSet(s?: Set<string>): string {
  if (!s) return "";
  return [...s].sort().join(",");
}

/**
 * Generic overlay hook for Globe3D.
 * Loads data for all enabled static/api layers and returns
 * a flat array of overlay points ready for the globe.
 */
export function useGlobeOverlays(enabledLayers?: Set<string>): GlobeOverlayPoint[] {
  const snapshot = useSyncExternalStore(
    overlayStore.subscribe,
    overlayStore.getSnapshot,
    overlayStore.getSnapshot,
  );

  const prevEnabled = useRef<Set<string>>(new Set());
  const serialized = serializeSet(enabledLayers);

  // Sync overlay store when enabled layers change
  // External store mutations (not setState) — safe in effects
  useEffect(() => {
    if (!enabledLayers) return;

    const current = enabledLayers;
    const prev = prevEnabled.current;

    // Newly enabled → fetch
    for (const id of current) {
      if (!prev.has(id) && loadableLayers.some((l) => l.id === id)) {
        fetchLayerData(id);
      }
    }

    // Newly disabled → remove from store
    for (const id of prev) {
      if (!current.has(id)) {
        overlayStore.removeLayer(id);
      }
    }

    prevEnabled.current = new Set(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  return useMemo(
    () => Object.values(snapshot).flat(),
    [snapshot],
  );
}
