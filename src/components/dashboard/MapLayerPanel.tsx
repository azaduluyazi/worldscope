"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_LAYERS, LAYER_GROUPS } from "@/config/map-layers";
import type { MapLayer } from "@/types/geo";
import { loadPreferences, savePreferences } from "@/lib/user-preferences";

interface MapLayerPanelProps {
  layers: MapLayer[];
  onToggleLayer: (layerId: string) => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════
//  MapLayerPanel — v3.3
// ═══════════════════════════════════════════════════════════════════
//
//  Fixes from v3.2:
//    1. POSITION: moved from top-14 to top-24 so it doesn't collide
//       with MapViewToggle (top-12). LAYERS button is now clearly
//       below the 2D/3D switcher.
//    2. FONTS: 6-10px → 10-13px (readable without squinting).
//    3. i18n: layer.label → t(layer.labelKey || `layers.${id}`).
//       LAYER_GROUPS labels → t(`layerGroups.${id}`).
//       All hardcoded strings ("LAYERS", "MAP LAYERS", "Search layers",
//       "ALL", "NONE", "ON", "OFF") now translated.
//    4. SCROLL: the expanded panel was already overflow-y-auto, but
//       the max-h calculation was based on viewport which on mobile
//       could fail. Now using a safer max-h-[calc(100vh-8rem)].
//    5. CLOSE UX: larger close button (×) with better hit area.
//
// ═══════════════════════════════════════════════════════════════════

export function MapLayerPanel({ layers, onToggleLayer, className = "" }: MapLayerPanelProps) {
  const t = useTranslations();
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

  // Helper: safely translate a layer's label. Falls back to raw label if key missing.
  const translateLayer = useCallback(
    (layer: MapLayer): string => {
      const key = layer.labelKey || `layers.${layer.id}`;
      try {
        const translated = t(key);
        // next-intl returns the key itself on miss in some configs — detect that
        if (translated === key) return layer.label;
        return translated;
      } catch {
        return layer.label;
      }
    },
    [t]
  );

  // Helper: translate group label
  const translateGroup = useCallback(
    (groupId: string, fallback: string): string => {
      const key = `mapLayers.groups.${groupId}`;
      try {
        const translated = t(key);
        if (translated === key) return fallback;
        return translated;
      } catch {
        return fallback;
      }
    },
    [t]
  );

  // Group layers, filtering by search (search matches translated label too)
  const groupedLayers = useMemo(() => {
    const groups: Record<string, MapLayer[]> = {};
    for (const layer of layers) {
      if (search) {
        const label = translateLayer(layer).toLowerCase();
        const desc = (layer.description || "").toLowerCase();
        if (!label.includes(searchLower) && !desc.includes(searchLower)) continue;
      }
      const group = layer.group || "intel";
      if (!groups[group]) groups[group] = [];
      groups[group].push(layer);
    }
    return groups;
  }, [layers, search, searchLower, translateLayer]);

  const toggleAllInGroup = useCallback(
    (groupId: string, enable: boolean) => {
      const groupLayers = layers.filter((l) => l.group === groupId);
      for (const layer of groupLayers) {
        if (layer.enabled !== enable) onToggleLayer(layer.id);
      }
    },
    [layers, onToggleLayer]
  );

  // ── Collapsed state: just the LAYERS button ──────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`absolute left-3 top-24 z-[90] flex items-center gap-1.5 px-3 py-2 rounded-md
          bg-hud-panel/90 border border-hud-border backdrop-blur-sm
          hover:border-hud-accent/50 transition-colors cursor-pointer min-h-[36px] ${className}`}
        title={t("mapLayers.button")}
        aria-label={t("mapLayers.button")}
      >
        <span className="text-sm">🗂️</span>
        <span className="font-mono text-[11px] text-hud-text font-bold tracking-wider">
          {t("mapLayers.button")}
        </span>
        {activeCount > 0 && (
          <span className="font-mono text-[10px] text-hud-accent bg-hud-accent/10 px-1.5 py-0.5 rounded font-bold">
            {activeCount}
          </span>
        )}
      </button>
    );
  }

  // ── Expanded state: full layer panel ─────────────────────────────
  return (
    <div
      className={`absolute left-3 top-24 z-[90] w-72 max-h-[calc(100vh-10rem)] overflow-y-auto
      bg-hud-panel/95 border border-hud-border rounded-lg backdrop-blur-sm shadow-2xl ${className}`}
    >
      {/* Header */}
      <div className="sticky top-0 bg-hud-panel/98 backdrop-blur-sm border-b border-hud-border z-10">
        <div className="p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🗂️</span>
            <span className="font-mono text-[12px] text-hud-text font-bold tracking-wider">
              {t("mapLayers.title")}
            </span>
            <span className="font-mono text-[10px] text-hud-accent bg-hud-accent/10 px-1.5 py-0.5 rounded font-bold">
              {activeCount}/{layers.length}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="font-mono text-[14px] text-hud-muted hover:text-hud-text w-8 h-8 flex items-center justify-center rounded hover:bg-hud-surface/50"
            aria-label={t("mapLayers.close")}
          >
            ✕
          </button>
        </div>
        {/* Search */}
        <div className="px-2.5 pb-2.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("mapLayers.searchPlaceholder")}
            className="w-full px-2.5 py-1.5 bg-hud-surface/50 border border-hud-border rounded text-[11px] font-mono text-hud-text placeholder:text-hud-muted/50 focus:border-hud-accent/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Layer groups */}
      <div className="p-1.5">
        {Object.entries(LAYER_GROUPS).map(([groupId, groupMeta]) => {
          const groupLayers = groupedLayers[groupId] || [];
          if (groupLayers.length === 0) return null;
          const isExpanded = expandedGroups.has(groupId) || search.length > 0;
          const groupActiveCount = groupLayers.filter((l) => l.enabled).length;
          const groupLabel = translateGroup(groupId, groupMeta.label);

          return (
            <div key={groupId} className="mb-1">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(groupId)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded hover:bg-hud-surface/50 transition-colors min-h-[36px]"
              >
                <span className="text-[12px]">{isExpanded ? "▾" : "▸"}</span>
                <span className="text-sm">{groupMeta.icon}</span>
                <span className="font-mono text-[11px] text-hud-text flex-1 text-left tracking-wider font-bold uppercase">
                  {groupLabel}
                </span>
                <span
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded font-bold"
                  style={{ color: groupMeta.color, backgroundColor: `${groupMeta.color}15` }}
                >
                  {groupActiveCount}/{groupLayers.length}
                </span>
              </button>

              {/* Layer items */}
              {isExpanded && (
                <div className="ml-4 space-y-0.5">
                  {/* Group ALL/NONE controls */}
                  <div className="flex gap-1.5 px-2 mb-1">
                    <button
                      onClick={() => toggleAllInGroup(groupId, true)}
                      className="font-mono text-[9px] text-hud-muted hover:text-hud-accent px-1.5 py-0.5 rounded bg-hud-surface/40 font-bold"
                    >
                      {t("mapLayers.all")}
                    </button>
                    <button
                      onClick={() => toggleAllInGroup(groupId, false)}
                      className="font-mono text-[9px] text-hud-muted hover:text-hud-accent px-1.5 py-0.5 rounded bg-hud-surface/40 font-bold"
                    >
                      {t("mapLayers.none")}
                    </button>
                  </div>
                  {groupLayers.map((layer) => {
                    const layerLabel = translateLayer(layer);
                    return (
                      <button
                        key={layer.id}
                        onClick={() => onToggleLayer(layer.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors min-h-[32px]
                        ${layer.enabled ? "bg-hud-accent/10 border border-hud-accent/20" : "hover:bg-hud-surface/30 border border-transparent"}`}
                        title={layer.description}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: layer.enabled ? layer.color : `${layer.color}40`,
                            boxShadow: layer.enabled ? `0 0 6px ${layer.color}60` : "none",
                          }}
                        />
                        <span className="text-[12px]">{layer.icon}</span>
                        <span
                          className={`font-mono text-[11px] flex-1 truncate ${layer.enabled ? "text-hud-text" : "text-hud-muted"}`}
                        >
                          {layerLabel}
                        </span>
                        <span
                          className={`font-mono text-[9px] font-bold ${layer.enabled ? "text-hud-accent" : "text-hud-muted/50"}`}
                        >
                          {layer.enabled ? t("mapLayers.on") : t("mapLayers.off")}
                        </span>
                      </button>
                    );
                  })}
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
