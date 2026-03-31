"use client";

import { useState, useCallback } from "react";
import type { Category, Severity } from "@/types/intel";
import { CATEGORY_ICONS } from "@/types/intel";

export interface AdvancedFilterValues {
  dateFrom: string;
  dateTo: string;
  severities: Set<Severity>;
  category: string;
  country: string;
  exactPhrase: boolean;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: AdvancedFilterValues) => void;
  onExport: () => void;
}

const ALL_SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const ALL_CATEGORIES: Category[] = [
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health", "sports",
];

const SEVERITY_DOT_COLORS: Record<Severity, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
  info: "#8a5cf6",
};

const defaultFilters = (): AdvancedFilterValues => ({
  dateFrom: "",
  dateTo: "",
  severities: new Set<Severity>(),
  category: "",
  country: "",
  exactPhrase: false,
});

export function AdvancedFilters({ onFilterChange, onExport }: AdvancedFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilterValues>(defaultFilters);

  const update = useCallback(
    (patch: Partial<AdvancedFilterValues>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        onFilterChange(next);
        return next;
      });
    },
    [onFilterChange]
  );

  const toggleSeverity = useCallback(
    (sev: Severity) => {
      setFilters((prev) => {
        const next = new Set(prev.severities);
        if (next.has(sev)) next.delete(sev);
        else next.add(sev);
        const updated = { ...prev, severities: next };
        onFilterChange(updated);
        return updated;
      });
    },
    [onFilterChange]
  );

  const clearAll = useCallback(() => {
    const reset = defaultFilters();
    setFilters(reset);
    onFilterChange(reset);
  }, [onFilterChange]);

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.severities.size > 0 ||
    filters.category ||
    filters.country ||
    filters.exactPhrase;

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md mb-4">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 font-mono text-[9px] text-hud-muted hover:text-hud-text transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>&#9654;</span>
          <span className="uppercase tracking-wider">Advanced Filters</span>
          {hasActiveFilters && (
            <span className="ml-1 px-1 py-0.5 bg-hud-accent/20 text-hud-accent rounded text-[7px]">
              ACTIVE
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            className="px-2 py-0.5 bg-hud-accent/10 text-hud-accent border border-hud-accent/30 rounded text-[8px] hover:bg-hud-accent/20 transition-colors"
          >
            EXPORT CSV
          </button>
        </span>
      </button>

      {/* Collapsible panel */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-hud-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            {/* Date from */}
            <div>
              <label className="block font-mono text-[8px] text-hud-muted uppercase tracking-wider mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => update({ dateFrom: e.target.value })}
                className="w-full bg-hud-base border border-hud-border rounded px-2 py-1 font-mono text-[9px] text-hud-text focus:border-hud-accent outline-none"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block font-mono text-[8px] text-hud-muted uppercase tracking-wider mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => update({ dateTo: e.target.value })}
                className="w-full bg-hud-base border border-hud-border rounded px-2 py-1 font-mono text-[9px] text-hud-text focus:border-hud-accent outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-mono text-[8px] text-hud-muted uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => update({ category: e.target.value })}
                className="w-full bg-hud-base border border-hud-border rounded px-2 py-1 font-mono text-[9px] text-hud-text focus:border-hud-accent outline-none"
              >
                <option value="">All Categories</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_ICONS[cat]} {cat.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block font-mono text-[8px] text-hud-muted uppercase tracking-wider mb-1">
                Country Code
              </label>
              <input
                type="text"
                placeholder="e.g. US, TR, RU"
                value={filters.country}
                onChange={(e) => update({ country: e.target.value.toUpperCase().slice(0, 2) })}
                maxLength={2}
                className="w-full bg-hud-base border border-hud-border rounded px-2 py-1 font-mono text-[9px] text-hud-text focus:border-hud-accent outline-none placeholder:text-hud-muted/50"
              />
            </div>
          </div>

          {/* Severity checkboxes */}
          <div className="mt-3">
            <label className="block font-mono text-[8px] text-hud-muted uppercase tracking-wider mb-1.5">
              Severity
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SEVERITIES.map((sev) => (
                <label
                  key={sev}
                  className="flex items-center gap-1 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={filters.severities.has(sev)}
                    onChange={() => toggleSeverity(sev)}
                    className="sr-only"
                  />
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[8px] uppercase tracking-wider transition-colors ${
                      filters.severities.has(sev)
                        ? "border-current bg-current/10"
                        : "border-hud-border text-hud-muted hover:text-hud-text"
                    }`}
                    style={
                      filters.severities.has(sev)
                        ? { color: SEVERITY_DOT_COLORS[sev], borderColor: `${SEVERITY_DOT_COLORS[sev]}60` }
                        : undefined
                    }
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: SEVERITY_DOT_COLORS[sev] }}
                    />
                    {sev}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Bottom row: exact phrase toggle + clear */}
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.exactPhrase}
                onChange={(e) => update({ exactPhrase: e.target.checked })}
                className="w-3 h-3 rounded border-hud-border bg-hud-base accent-hud-accent"
              />
              <span className="font-mono text-[8px] text-hud-muted uppercase tracking-wider">
                Exact Phrase Match
              </span>
            </label>

            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="font-mono text-[8px] text-hud-muted hover:text-hud-accent uppercase tracking-wider transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
