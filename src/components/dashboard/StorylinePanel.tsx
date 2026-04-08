"use client";

import { useState } from "react";
import { useStorylines } from "@/hooks/useStorylines";
import type { Storyline } from "@/lib/convergence/storyline";

// ═══════════════════════════════════════════════════════════════════
//  StorylinePanel — long-lived narrative view
// ═══════════════════════════════════════════════════════════════════
//
//  Sibling to ConvergencePanel. Where ConvergencePanel shows the
//  LATEST convergence snapshots (5-min cache), this panel shows the
//  LONG-LIVED storylines those snapshots roll up into.
//
//  Usage in layout:
//    import { StorylinePanel } from "@/components/dashboard/StorylinePanel"
//    <StorylinePanel />
//
//  Data flow:
//    cron → engine.attachConvergencesToStorylines → upsertStoryline
//    UI   → useStorylines (SWR, 2min refresh) → /api/convergence/storylines
//
// ═══════════════════════════════════════════════════════════════════

function confidenceColor(c: number): string {
  if (c >= 0.85) return "#ff4757";
  if (c >= 0.70) return "#ffd000";
  if (c >= 0.50) return "#00e5ff";
  return "#00ff88";
}

const CATEGORY_ICONS: Record<string, string> = {
  conflict: "\u2694\ufe0f",
  finance: "\ud83d\udcca",
  cyber: "\ud83d\udee1\ufe0f",
  tech: "\ud83d\udcbb",
  natural: "\ud83c\udf0d",
  aviation: "\u2708\ufe0f",
  energy: "\u26a1",
  diplomacy: "\ud83c\udfdb\ufe0f",
  protest: "\ud83d\udce2",
  health: "\ud83c\udfe5",
  sports: "\u26bd",
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatRemaining(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "expired";
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

function StorylineCard({
  storyline,
  isExpanded,
  onToggle,
}: {
  storyline: Storyline;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = confidenceColor(storyline.peakConfidence);
  const topCategories = storyline.categories.slice(0, 5);

  return (
    <button
      onClick={onToggle}
      className="w-full text-left bg-hud-surface/40 border rounded-md p-2 transition-all hover:bg-hud-surface/60"
      style={{ borderColor: `${color}40` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span
            className="font-mono text-[7px] font-bold px-1 py-px rounded"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {Math.round(storyline.peakConfidence * 100)}%
          </span>
          <span className="font-mono text-[7px] text-hud-muted">
            {storyline.snapshots.length} snapshots
          </span>
        </div>
        <span className="font-mono text-[7px] text-hud-muted">
          {formatRemaining(storyline.expiresAt)}
        </span>
      </div>

      {/* Headline */}
      <div className="font-mono text-[9px] text-hud-text leading-tight mb-1 line-clamp-2">
        {storyline.headline}
      </div>

      {/* Categories + regions */}
      <div className="flex items-center gap-1 flex-wrap">
        {topCategories.map((cat) => (
          <span
            key={cat}
            className="font-mono text-[7px] px-1 py-px rounded bg-hud-base/50 text-hud-muted"
          >
            {CATEGORY_ICONS[cat] || "\u25c6"} {cat}
          </span>
        ))}
        <span className="font-mono text-[7px] text-hud-muted ml-auto">
          {"\ud83d\udccd"} {storyline.affectedRegions.join(",")}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-1 text-[7px] font-mono text-hud-muted">
        <span>created {formatTimeAgo(storyline.createdAt)}</span>
        <span className="text-hud-border">|</span>
        <span>last {formatTimeAgo(storyline.lastActivityAt)}</span>
      </div>

      {/* Expanded: snapshot timeline */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-hud-border/30 fade-slide-in">
          <div className="font-mono text-[7px] text-hud-accent mb-1">
            {"\u2588"} SNAPSHOT TIMELINE
          </div>
          <div className="space-y-1">
            {storyline.snapshots
              .slice(-6)
              .reverse()
              .map((snap) => {
                const sc = confidenceColor(snap.confidence);
                return (
                  <div
                    key={snap.id}
                    className="flex items-start gap-1.5 text-[7px] font-mono"
                  >
                    <span
                      className="shrink-0 mt-px w-1 h-1 rounded-full"
                      style={{ backgroundColor: sc }}
                    />
                    <span className="text-hud-muted">
                      {formatTimeAgo(snap.createdAt)}
                    </span>
                    <span
                      className="shrink-0 px-1 rounded"
                      style={{ backgroundColor: `${sc}20`, color: sc }}
                    >
                      {Math.round(snap.confidence * 100)}%
                    </span>
                    <span className="text-hud-text leading-tight line-clamp-1 flex-1">
                      {snap.signals[0]?.title ?? "—"}
                    </span>
                  </div>
                );
              })}
            {storyline.snapshots.length > 6 && (
              <span className="font-mono text-[7px] text-hud-muted">
                +{storyline.snapshots.length - 6} older snapshots
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
      <div className="w-10 h-10 rounded-full border border-hud-border/40 flex items-center justify-center mb-2">
        <span className="text-lg opacity-40">{"\ud83d\udcd6"}</span>
      </div>
      <span className="font-mono text-[9px] text-hud-muted">NO ACTIVE STORYLINES</span>
      <span className="font-mono text-[7px] text-hud-muted/60 mt-0.5">
        Multi-day narratives appear here as convergences cluster
      </span>
    </div>
  );
}

export function StorylinePanel() {
  const { storylines, count, isLoading } = useStorylines({
    limit: 20,
    refreshInterval: 120_000,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...storylines].sort(
    (a, b) => b.peakConfidence - a.peakConfidence
  );

  return (
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[9px] flex items-center gap-1.5">
          <span className="text-hud-accent inline-block w-1.5 h-1.5 rounded-full bg-hud-accent/60" />
          ACTIVE STORYLINES
        </span>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="font-mono text-[7px] text-hud-muted animate-pulse">
              LOADING...
            </span>
          )}
          <span className="font-mono text-[8px] text-hud-muted">
            {count} active
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 space-y-1.5 scrollbar-hide">
        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          sorted.map((s) => (
            <StorylineCard
              key={s.id}
              storyline={s}
              isExpanded={expandedId === s.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === s.id ? null : s.id))
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
