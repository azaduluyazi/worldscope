"use client";

import { useMemo } from "react";
import type { MapFilters } from "@/types/geo";
import { VARIANTS, getVariantCategories, type VariantId } from "@/config/variants";

interface SidebarItem {
  id: string;
  icon: string;
  label: string;
  color: string;
  /** Maps to a category filter value */
  category: string;
}

/** All 10 categories with their icons and colors */
const ALL_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "conflict", icon: "⚔️", label: "Conflicts", color: "#ff4757", category: "conflict" },
  { id: "natural", icon: "🌍", label: "Natural", color: "#00ff88", category: "natural" },
  { id: "cyber", icon: "🛡️", label: "Cyber", color: "#00e5ff", category: "cyber" },
  { id: "finance", icon: "📊", label: "Markets", color: "#ffd000", category: "finance" },
  { id: "tech", icon: "💻", label: "Tech", color: "#8a5cf6", category: "tech" },
  { id: "aviation", icon: "✈️", label: "Aviation", color: "#00ff88", category: "aviation" },
  { id: "health", icon: "🏥", label: "Health", color: "#ff4757", category: "health" },
  { id: "diplomacy", icon: "🏛️", label: "Diplomacy", color: "#00e5ff", category: "diplomacy" },
  { id: "energy", icon: "⚡", label: "Energy", color: "#ffd000", category: "energy" },
  { id: "protest", icon: "📢", label: "Protests", color: "#ff4757", category: "protest" },
];

interface IconSidebarProps {
  variant?: VariantId;
  filters: MapFilters;
  onToggleCategory: (cat: string) => void;
  onToggleHeatmap: () => void;
  onToggleClusters: () => void;
}

export function IconSidebar({
  variant = "world",
  filters,
  onToggleCategory,
  onToggleHeatmap,
  onToggleClusters,
}: IconSidebarProps) {
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
              title={`${item.label}${isActive ? " (filtered)" : ""}`}
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
          title="Clear all filters"
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
        title={`Heatmap ${filters.heatmap ? "ON" : "OFF"}`}
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
        title={`Clusters ${filters.clusters ? "ON" : "OFF"}`}
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

      {/* Settings */}
      <button
        title="Settings"
        className="w-9 h-9 rounded-md bg-hud-panel border border-hud-border flex items-center justify-center text-base hover:border-hud-muted transition-colors"
      >
        ⚙️
      </button>
    </aside>
  );
}
