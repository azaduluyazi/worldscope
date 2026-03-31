"use client";

import { useMemo } from "react";
import type { EventCluster } from "@/lib/utils/event-clustering";
import { SEVERITY_COLORS } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";

interface SourceComparisonProps {
  cluster: EventCluster;
}

/** Deterministic color palette for source borders */
const SOURCE_COLORS = [
  "#00e5ff", "#ff4757", "#ffd000", "#00ff88", "#8a5cf6",
  "#ff6b81", "#1e90ff", "#ff8c00", "#7bed9f", "#e056fd",
];

function getSourceColor(source: string, index: number): string {
  // Use index for deterministic assignment within cluster
  return SOURCE_COLORS[index % SOURCE_COLORS.length];
}

export function SourceComparison({ cluster }: SourceComparisonProps) {
  const sortedItems = useMemo(() => {
    // Sort by severity (most severe first), then by recency
    return [...cluster.items].sort((a, b) => {
      const sevDiff =
        (["critical", "high", "medium", "low", "info"].indexOf(a.severity)) -
        (["critical", "high", "medium", "low", "info"].indexOf(b.severity));
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [cluster.items]);

  // Map each unique source to a color
  const sourceColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const seen: string[] = [];
    for (const item of sortedItems) {
      if (!map.has(item.source)) {
        map.set(item.source, getSourceColor(item.source, seen.length));
        seen.push(item.source);
      }
    }
    return map;
  }, [sortedItems]);

  return (
    <div className="rounded-lg bg-black/40 border border-white/10 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          Multi-Source Comparison
        </h3>
        <p className="text-white/90 text-sm font-medium leading-snug mb-2">
          {cluster.primaryTitle}
        </p>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
            {cluster.sourceCount} source{cluster.sourceCount !== 1 ? "s" : ""} reporting
          </span>
          {cluster.commonEntities.length > 0 && (
            <span className="text-white/40">
              Key:{" "}
              {cluster.commonEntities.slice(0, 5).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable horizontal card row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {sortedItems.map((item) => {
          const borderColor = sourceColorMap.get(item.source) || "#444";
          const severityColor = SEVERITY_COLORS[item.severity];

          return (
            <a
              key={item.id}
              href={item.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-72 rounded-md bg-white/5 hover:bg-white/10 transition-colors duration-200 p-3 group"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              {/* Source name */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-mono font-bold uppercase tracking-wide"
                  style={{ color: borderColor }}
                >
                  {item.source}
                </span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                  style={{
                    color: severityColor,
                    backgroundColor: `${severityColor}20`,
                  }}
                >
                  {item.severity}
                </span>
              </div>

              {/* Title */}
              <p className="text-white/90 text-xs font-medium leading-relaxed mb-2 line-clamp-3 group-hover:text-white transition-colors">
                {item.title}
              </p>

              {/* Summary snippet */}
              {item.summary && (
                <p className="text-white/40 text-[11px] leading-relaxed mb-2 line-clamp-3">
                  {item.summary.slice(0, 200)}
                  {item.summary.length > 200 ? "..." : ""}
                </p>
              )}

              {/* Footer: time */}
              <div className="flex items-center justify-between text-[10px] text-white/30 mt-auto pt-1 border-t border-white/5">
                <span>{timeAgo(item.publishedAt)}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400">
                  Open
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
