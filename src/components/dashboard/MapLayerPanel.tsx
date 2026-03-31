"use client";

import { useState, useCallback, useMemo } from "react";
import { DEFAULT_LAYERS, LAYER_GROUPS } from "@/config/map-layers";
import type { MapLayer } from "@/types/geo";
import { loadPreferences, savePreferences } from "@/lib/user-preferences";

interface MapLayerPanelProps {
  layers: MapLayer[];
  onToggleLayer: (layerId: string) => void;
  className?: string;
}

/**
 * MapLayerPanel — collapsible sidebar for toggling 74+ map layers.
 * Groups layers into 12 categories with search functionality.
 */
export function MapLayerPanel({ layers, onToggleLayer, className = "" }: MapLayerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["conflict", "natural"]));
  const [search, setSearch] = useState("");

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const activeCount = layers.filter((l) => l.enabled).length;
  const searchLower = search.toLowerCase();

  // Group layers, filtering by search
  const groupedLayers = useMemo(() => {
    const groups: Record<string, MapLayer[]> = {};
    for (const layer of layers) {
      if (search && !layer.label.toLowerCase().includes(searchLower) && !(layer.description || "").toLowerCase().includes(searchLower)) {
        continue;
      }
      const group = layer.group || "intel";
      if (!groups[group]) groups[group] = [];
      groups[group].push(layer);
    }
    return groups;
  }, [layers, search, searchLower]);

  const toggleAllInGroup = useCallback((groupId: string, enable: boolean) => {
    const groupLayers = layers.filter((l) => l.group === groupId);
    for (const layer of groupLayers) {
      if (layer.enabled !== enable) onToggleLayer(layer.id);
    }
  }, [layers, onToggleLayer]);

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
    <div className={`absolute left-2 top-14 z-[90] w-60 max-h-[75vh] overflow-y-auto
      bg-hud-panel/95 border border-hud-border rounded-lg backdrop-blur-sm shadow-lg ${className}`}>

      {/* Header */}
      <div className="sticky top-0 bg-hud-panel/95 backdrop-blur-sm border-b border-hud-border z-10">
        <div className="p-2 flex items-center justify-between">
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
        {/* Search */}
        <div className="px-2 pb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search layers..."
            className="w-full px-2 py-1 bg-hud-surface/50 border border-hud-border rounded text-[9px] font-mono text-hud-text placeholder:text-hud-muted/50 focus:border-hud-accent/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Layer groups */}
      <div className="p-1">
        {Object.entries(LAYER_GROUPS).map(([groupId, groupMeta]) => {
          const groupLayers = groupedLayers[groupId] || [];
          if (groupLayers.length === 0) return null;
          const isExpanded = expandedGroups.has(groupId) || search.length > 0;
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
                <span
                  className="font-mono text-[7px] px-1 rounded"
                  style={{ color: groupMeta.color, backgroundColor: `${groupMeta.color}15` }}
                >
                  {groupActiveCount}/{groupLayers.length}
                </span>
              </button>

              {/* Layer items */}
              {isExpanded && (
                <div className="ml-3 space-y-0.5">
                  {/* Group ALL/NONE controls */}
                  <div className="flex gap-1 px-2 mb-0.5">
                    <button
                      onClick={() => toggleAllInGroup(groupId, true)}
                      className="font-mono text-[6px] text-hud-muted hover:text-hud-accent px-1 rounded bg-hud-surface/30"
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => toggleAllInGroup(groupId, false)}
                      className="font-mono text-[6px] text-hud-muted hover:text-hud-accent px-1 rounded bg-hud-surface/30"
                    >
                      NONE
                    </button>
                  </div>
                  {groupLayers.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => onToggleLayer(layer.id)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left transition-colors
                        ${layer.enabled ? "bg-hud-accent/10 border border-hud-accent/20" : "hover:bg-hud-surface/30 border border-transparent"}`}
                      title={layer.description}
                    >
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

/** Hook: manage map layer state with localStorage persistence */
export function useMapLayers() {
  const [layers, setLayers] = useState<MapLayer[]>(() => {
    const prefs = loadPreferences();
    const saved = new Set(prefs.enabledLayerIds || ["conflicts", "natural"]);
    return DEFAULT_LAYERS.map((l) => ({ ...l, enabled: saved.has(l.id) }));
  });

  const toggleLayer = useCallback((layerId: string) => {
    setLayers((prev) => {
      const next = prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l));
      const enabledIds = next.filter((l) => l.enabled).map((l) => l.id);
      savePreferences({ enabledLayerIds: enabledIds });
      return next;
    });
  }, []);

  const enabledLayerIds = new Set(layers.filter((l) => l.enabled).map((l) => l.id));

  return { layers, toggleLayer, enabledLayerIds };
}
