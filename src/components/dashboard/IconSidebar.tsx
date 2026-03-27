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

/**
 * Categories shown in sidebar — only those useful as MAP FILTERS.
 * Removed: tech, finance (already covered by variant tabs)
 */
const CATEGORY_ITEMS: SidebarItem[] = [
  { id: "conflict", icon: "⚔️", tKey: "sidebar.conflicts", color: "#ff4757", category: "conflict" },
  { id: "natural", icon: "🌍", tKey: "sidebar.natural", color: "#00ff88", category: "natural" },
  { id: "health", icon: "🏥", tKey: "sidebar.health", color: "#ff4757", category: "health" },
  { id: "energy", icon: "⚡", tKey: "sidebar.energy", color: "#ffd000", category: "energy" },
  { id: "sports", icon: "⚽", tKey: "sidebar.sports", color: "#22c55e", category: "sports" },
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
  const { all } = useMemo(() => getVariantCategories(variant), [variant]);
  const hasActiveFilters = filters.categories.size > 0;

  return (
    <aside role="navigation" aria-label="Map filter sidebar" className="w-[52px] bg-hud-surface border-r border-hud-border flex flex-col items-center py-2 gap-1 z-50">
      {CATEGORY_ITEMS
        .filter((item) => all.has(item.category as never))
        .map((item) => {
          const isActive = filters.categories.has(item.category);
          return (
            <button
              key={item.id}
              onClick={() => onToggleCategory(item.category)}
              title={t(item.tKey)}
              aria-label={t(item.tKey)}
              aria-pressed={filters.categories.has(item.category)}
              className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all relative
                ${isActive
                  ? "bg-hud-accent/10 border border-hud-accent/30"
                  : "bg-hud-panel border border-hud-border hover:border-hud-muted"
                }`}
              style={isActive ? { borderColor: `${item.color}60`, boxShadow: `0 0 8px ${item.color}30` } : undefined}
            >
              {item.icon}
              {isActive && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              )}
            </button>
          );
        })}

      {hasActiveFilters && (
        <button
          title={t("sidebar.clearFilters")}
          onClick={() => filters.categories.forEach((cat) => onToggleCategory(cat))}
          className="w-9 h-9 rounded-md bg-severity-critical/10 border border-severity-critical/30 flex items-center justify-center text-[10px] font-mono text-severity-critical hover:bg-severity-critical/20 transition-colors"
        >
          CLR
        </button>
      )}

      <div className="w-6 border-t border-hud-border my-1" />

      <button
        title={t("sidebar.heatmap")}
        onClick={onToggleHeatmap}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all
          ${filters.heatmap ? "bg-hud-accent/10 border border-hud-accent/30" : "bg-hud-panel border border-hud-border hover:border-hud-muted"}`}
      >
        🔥
      </button>

      <button
        title={t("sidebar.clusters")}
        onClick={onToggleClusters}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all
          ${filters.clusters ? "bg-hud-accent/10 border border-hud-accent/30" : "bg-hud-panel border border-hud-border hover:border-hud-muted"}`}
      >
        🎯
      </button>

      <div className="flex-1" />

      <button
        title={t("tracking.vessels")}
        aria-label={t("tracking.vessels")}
        aria-pressed={!!filters.vessels}
        onClick={() => onToggleLayer("vessels")}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all
          ${filters.vessels ? "bg-[#00ff88]/10 border border-[#00ff88]/30" : "bg-hud-panel border border-hud-border hover:border-hud-muted opacity-50"}`}
      >
        🚢
      </button>

      <button
        title="GPS"
        aria-label="GPS"
        aria-pressed={!!filters.gpsJamming}
        onClick={() => onToggleLayer("gpsJamming")}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all
          ${filters.gpsJamming ? "bg-[#ff4757]/10 border border-[#ff4757]/30" : "bg-hud-panel border border-hud-border hover:border-hud-muted opacity-50"}`}
      >
        📡
      </button>

      <button
        title={t("sidebar.settings")}
        className="w-9 h-9 rounded-md bg-hud-panel border border-hud-border flex items-center justify-center text-sm hover:border-hud-muted transition-colors"
      >
        ⚙️
      </button>
    </aside>
  );
}
