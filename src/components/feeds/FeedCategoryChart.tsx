"use client";

import type { Category } from "@/types/intel";

/** Inline category colors — no CATEGORY_COLORS export exists in intel.ts */
const CATEGORY_COLORS: Record<Category, string> = {
  conflict: "#ff4757",
  finance: "#ffd000",
  cyber: "#8a5cf6",
  tech: "#00e5ff",
  natural: "#00ff88",
  aviation: "#38bdf8",
  energy: "#f97316",
  diplomacy: "#a78bfa",
  protest: "#fb7185",
  health: "#34d399",
};

interface Props {
  byCategory: Record<string, { active: number; total: number }>;
}

export function FeedCategoryChart({ byCategory }: Props) {
  const categories = Object.entries(byCategory).sort(
    (a, b) => b[1].total - a[1].total
  );
  const maxTotal = Math.max(...categories.map(([, v]) => v.total), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-mono text-hud-accent uppercase tracking-wider">
        Feed Distribution
      </h3>
      {categories.map(([cat, { active, total }]) => (
        <div key={cat} className="flex items-center gap-3">
          <span className="text-xs font-mono text-hud-muted w-20 truncate uppercase">
            {cat}
          </span>
          <div className="flex-1 h-4 bg-hud-border rounded overflow-hidden relative">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${(total / maxTotal) * 100}%`,
                backgroundColor:
                  CATEGORY_COLORS[cat as Category] || "#00e5ff",
                opacity: 0.3,
              }}
            />
            <div
              className="h-full rounded absolute top-0 left-0 transition-all"
              style={{
                width: `${(active / maxTotal) * 100}%`,
                backgroundColor:
                  CATEGORY_COLORS[cat as Category] || "#00e5ff",
              }}
            />
          </div>
          <span className="text-xs font-mono text-hud-muted w-16 text-right">
            {active}/{total}
          </span>
        </div>
      ))}
    </div>
  );
}
