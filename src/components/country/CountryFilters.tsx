"use client";

import { useTranslations } from "next-intl";
import { CATEGORY_ICONS, SEVERITY_COLORS } from "@/types/intel";
import type { Category, Severity } from "@/types/intel";

const CATEGORIES: Category[] = [
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health",
];

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];

interface CountryFiltersProps {
  activeCategories: Set<string>;
  activeSeverities: Set<string>;
  onToggleCategory: (cat: string) => void;
  onToggleSeverity: (sev: string) => void;
  onClear: () => void;
}

export function CountryFilters({
  activeCategories,
  activeSeverities,
  onToggleCategory,
  onToggleSeverity,
  onClear,
}: CountryFiltersProps) {
  const t = useTranslations("country");
  const hasFilters = activeCategories.size > 0 || activeSeverities.size > 0;

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] font-bold text-hud-accent tracking-wider">
          ◆ {t("filters")}
        </span>
        {hasFilters && (
          <button
            onClick={onClear}
            className="font-mono text-[8px] text-hud-muted hover:text-hud-accent transition-colors"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Category toggles */}
      <div className="flex flex-wrap gap-1 mb-2">
        {CATEGORIES.map((cat) => {
          const active = activeCategories.has(cat);
          return (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`font-mono text-[8px] px-1.5 py-0.5 rounded border transition-all ${
                active
                  ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent"
                  : "bg-hud-panel border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-muted"
              }`}
              title={cat}
            >
              {CATEGORY_ICONS[cat]} {cat.slice(0, 4).toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Severity toggles */}
      <div className="flex gap-1">
        {SEVERITIES.map((sev) => {
          const active = activeSeverities.has(sev);
          const color = SEVERITY_COLORS[sev];
          return (
            <button
              key={sev}
              onClick={() => onToggleSeverity(sev)}
              className={`font-mono text-[8px] px-1.5 py-0.5 rounded border transition-all ${
                !active ? "bg-hud-panel border-hud-border text-hud-muted hover:text-hud-text" : ""
              }`}
              style={active ? {
                backgroundColor: `${color}20`,
                borderColor: `${color}50`,
                color: color,
              } : undefined}
            >
              {sev.slice(0, 4).toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
