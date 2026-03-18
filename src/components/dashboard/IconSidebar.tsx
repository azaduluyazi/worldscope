"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { MapFilters } from "@/types/geo";
import { getVariantCategories, type VariantId } from "@/config/variants";

interface SidebarItem {
  id: string;
  icon: string;
  tKey: string;
  color: string;
  category: string;
}

/** All 10 categories with their icons and colors */
const ALL_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "conflict", icon: "⚔️", tKey: "sidebar.conflicts", color: "#ff4757", category: "conflict" },
  { id: "natural", icon: "🌍", tKey: "sidebar.natural", color: "#00ff88", category: "natural" },
  { id: "cyber", icon: "🛡️", tKey: "sidebar.cyber", color: "#00e5ff", category: "cyber" },
  { id: "finance", icon: "📊", tKey: "sidebar.markets", color: "#ffd000", category: "finance" },
  { id: "tech", icon: "💻", tKey: "sidebar.tech", color: "#8a5cf6", category: "tech" },
  { id: "aviation", icon: "✈️", tKey: "sidebar.aviation", color: "#00ff88", category: "aviation" },
  { id: "health", icon: "🏥", tKey: "sidebar.health", color: "#ff4757", category: "health" },
  { id: "diplomacy", icon: "🏛️", tKey: "sidebar.diplomacy", color: "#00e5ff", category: "diplomacy" },
  { id: "energy", icon: "⚡", tKey: "sidebar.energy", color: "#ffd000", category: "energy" },
  { id: "protest", icon: "📢", tKey: "sidebar.protests", color: "#ff4757", category: "protest" },
];

interface IconSidebarProps {
  variant?: VariantId;
  filters: MapFilters;
  onToggleCategory: (cat: string) => void;
  onToggleHeatmap: () => void;
  onToggleClusters: () => void;
  onToggleLayer: (layer: "flights" | "vessels" | "gpsJamming" | "cables") => void;
}

export function IconSidebar({
  variant = "world",
  filters,
  onToggleCategory,
  onToggleHeatmap,
  onToggleClusters,
  onToggleLayer,
}: IconSidebarProps) {
  const t = useTranslations();
  const { primary, all } = useMemo(() => getVariantCategories(variant), [variant]);
  const hasActiveFilters = filters.categories.size > 0;

  return (
    <aside className="w-[52px] bg-hud-surface border-r border-hud-border flex flex-col items-center py-2 gap-1 z-50">
      {/* Category filters — filtered by variant */}
      {ALL_SIDEBAR_ITEMS
        .filter((item) => all.has(item.category as never))
        .map((item) => {
          const isActive = filters.categories.has(item.category);
          const isPrimary = primary.has(item.category as never);

          return (
            <button
              key={item.id}
              onClick={() => onToggleCategory(item.category)}
              title={`${t(item.tKey)}${isActive ? " (filtered)" : ""}`}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-all relative
                ${isPrimary ? "text-base" : "text-sm opacity-60"}
                ${
                  isActive
                    ? "bg-hud-accent/10 border border-hud-accent/30 shadow-[0_0_8px_rgba(0,229,255,0.2)]"
                    : "bg-hud-panel border border-hud-border hover:border-hud-muted"
                }`}
              style={isActive ? { borderColor: `${item.color}60`, boxShadow: `0 0 8px ${item.color}30` } : undefined}
            >
              {item.icon}
              {/* Active indicator dot */}
              {isActive && (
                <div
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
            </button>
          );
        })}

      {/* Divider */}
      <div className="w-6 border-t border-hud-border my-1" />

      {/* Clear all filters */}
      {hasActiveFilters && (
        <button
          title={t("sidebar.clearFilters")}
          onClick={() => {
            // Toggle off all active categories
            filters.categories.forEach((cat) => onToggleCategory(cat));
          }}
          className="w-9 h-9 rounded-md bg-severity-critical/10 border border-severity-critical/30 flex items-center justify-center text-[10px] font-mono text-severity-critical hover:bg-severity-critical/20 transition-colors"
        >
          CLR
        </button>
      )}

      <div className="flex-1" />

      {/* Heatmap toggle */}
      <button
        title={`${t("sidebar.heatmap")} ${filters.heatmap ? "ON" : "OFF"}`}
        onClick={onToggleHeatmap}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-base transition-all
          ${
            filters.heatmap
              ? "bg-hud-accent/10 border border-hud-accent/30"
              : "bg-hud-panel border border-hud-border hover:border-hud-muted"
          }`}
      >
        🔥
      </button>

      {/* Cluster toggle */}
      <button
        title={`${t("sidebar.clusters")} ${filters.clusters ? "ON" : "OFF"}`}
        onClick={onToggleClusters}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-base transition-all
          ${
            filters.clusters
              ? "bg-hud-accent/10 border border-hud-accent/30"
              : "bg-hud-panel border border-hud-border hover:border-hud-muted"
          }`}
      >
        🎯
      </button>

      {/* Divider */}
      <div className="w-6 border-t border-hud-border my-0.5" />

      {/* Flights toggle */}
      <button
        title={`Flights ${filters.flights ? "ON" : "OFF"}`}
        onClick={() => onToggleLayer("flights")}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all
          ${filters.flights
            ? "bg-[#8a5cf6]/10 border border-[#8a5cf6]/30"
            : "bg-hud-panel border border-hud-border hover:border-hud-muted opacity-50"
          }`}
      >
        ✈️
      </button>

      {/* Vessels toggle */}
      <button
        title={`Vessels ${filters.vessels ? "ON" : "OFF"}`}
        onClick={() => onToggleLayer("vessels")}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all
          ${filters.vessels
            ? "bg-[#00e5ff]/10 border border-[#00e5ff]/30"
            : "bg-hud-panel border border-hud-border hover:border-hud-muted opacity-50"
          }`}
      >
        🚢
      </button>

      {/* GPS Jamming toggle */}
      <button
        title={`GPS Jamming ${filters.gpsJamming ? "ON" : "OFF"}`}
        onClick={() => onToggleLayer("gpsJamming")}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all
          ${filters.gpsJamming
            ? "bg-[#ff4757]/10 border border-[#ff4757]/30"
            : "bg-hud-panel border border-hud-border hover:border-hud-muted opacity-50"
          }`}
      >
        📡
      </button>

      {/* Submarine Cables toggle */}
      <button
        title={`Cables ${filters.cables ? "ON" : "OFF"}`}
        onClick={() => onToggleLayer("cables")}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all
          ${filters.cables
            ? "bg-[#00e5ff]/10 border border-[#00e5ff]/30"
            : "bg-hud-panel border border-hud-border hover:border-hud-muted opacity-50"
          }`}
      >
        🔌
      </button>

      {/* Settings */}
      <button
        title={t("sidebar.settings")}
        className="w-9 h-9 rounded-md bg-hud-panel border border-hud-border flex items-center justify-center text-base hover:border-hud-muted transition-colors"
      >
        ⚙️
      </button>
    </aside>
  );
}
