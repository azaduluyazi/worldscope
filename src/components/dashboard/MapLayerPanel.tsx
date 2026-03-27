"use client";

import { useState, useCallback } from "react";
import { DEFAULT_LAYERS, LAYER_GROUPS } from "@/config/map-layers";
import type { MapLayer, LayerGroup } from "@/types/geo";

interface MapLayerPanelProps {
  layers: MapLayer[];
  onToggleLayer: (layerId: string) => void;
  className?: string;
}

/**
 * MapLayerPanel — collapsible sidebar for toggling 25+ map layers.
 * Groups layers by category (Conflict, Natural, Cyber, Finance, Infrastructure, Tracking).
 */
export function MapLayerPanel({ layers, onToggleLayer, className = "" }: MapLayerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["conflict", "natural"]));

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const activeCount = layers.filter((l) => l.enabled).length;

  // Group layers by their group property
  const groupedLayers: Record<string, MapLayer[]> = {};
  for (const layer of layers) {
    const group = layer.group || "intel";
    if (!groupedLayers[group]) groupedLayers[group] = [];
    groupedLayers[group].push(layer);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`absolute left-2 top-14 z-[90] flex items-center gap-1 px-2 py-1.5 rounded-md
          bg-hud-panel/90 border border-hud-border backdrop-blur-sm
          hover:border-hud-accent/50 transition-colors cursor-pointer ${className}`}
        title="Map Layers"
      >
        <span className="text-xs">🗂️</span>
        <span className="font-mono text-[9px] text-hud-text">LAYERS</span>
        {activeCount > 0 && (
          <span className="font-mono text-[8px] text-hud-accent bg-hud-accent/10 px-1 rounded">
            {activeCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`absolute left-2 top-14 z-[90] w-56 max-h-[70vh] overflow-y-auto
      bg-hud-panel/95 border border-hud-border rounded-lg backdrop-blur-sm shadow-lg ${className}`}>

      {/* Header */}
      <div className="sticky top-0 bg-hud-panel/95 backdrop-blur-sm p-2 border-b border-hud-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🗂️</span>
          <span className="font-mono text-[9px] text-hud-text font-bold tracking-wider">MAP LAYERS</span>
          <span className="font-mono text-[8px] text-hud-accent bg-hud-accent/10 px-1 rounded">
            {activeCount}/{layers.length}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="font-mono text-[9px] text-hud-muted hover:text-hud-text px-1"
        >
          ✕
        </button>
      </div>

      {/* Layer groups */}
      <div className="p-1">
        {Object.entries(LAYER_GROUPS).map(([groupId, groupMeta]) => {
          const groupLayers = groupedLayers[groupId] || [];
          if (groupLayers.length === 0) return null;
          const isExpanded = expandedGroups.has(groupId);
          const groupActiveCount = groupLayers.filter((l) => l.enabled).length;

          return (
            <div key={groupId} className="mb-0.5">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(groupId)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-hud-surface/50 transition-colors"
              >
                <span className="text-[10px]">{isExpanded ? "▾" : "▸"}</span>
                <span className="text-xs">{groupMeta.icon}</span>
                <span className="font-mono text-[8px] text-hud-text flex-1 text-left tracking-wider">
                  {groupMeta.label.toUpperCase()}
                </span>
                {groupActiveCount > 0 && (
                  <span
                    className="font-mono text-[7px] px-1 rounded"
                    style={{ color: groupMeta.color, backgroundColor: `${groupMeta.color}15` }}
                  >
                    {groupActiveCount}
                  </span>
                )}
              </button>

              {/* Layer items */}
              {isExpanded && (
                <div className="ml-3 space-y-0.5">
                  {groupLayers.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => onToggleLayer(layer.id)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left transition-colors
                        ${layer.enabled ? "bg-hud-accent/10 border border-hud-accent/20" : "hover:bg-hud-surface/30 border border-transparent"}`}
                      title={layer.description}
                    >
                      {/* Color dot */}
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: layer.enabled ? layer.color : `${layer.color}40`,
                          boxShadow: layer.enabled ? `0 0 6px ${layer.color}60` : "none",
                        }}
                      />
                      <span className="text-[10px]">{layer.icon}</span>
                      <span className={`font-mono text-[8px] flex-1 truncate ${layer.enabled ? "text-hud-text" : "text-hud-muted"}`}>
                        {layer.label}
                      </span>
                      {/* Toggle indicator */}
                      <span className={`font-mono text-[7px] ${layer.enabled ? "text-hud-accent" : "text-hud-muted/50"}`}>
                        {layer.enabled ? "ON" : "OFF"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Helper: get initial layer state from DEFAULT_LAYERS */
export function useMapLayers() {
  const [layers, setLayers] = useState<MapLayer[]>(() => [...DEFAULT_LAYERS]);

  const toggleLayer = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l))
    );
  }, []);

  const enabledLayerIds = new Set(layers.filter((l) => l.enabled).map((l) => l.id));

  return { layers, toggleLayer, enabledLayerIds };
}
