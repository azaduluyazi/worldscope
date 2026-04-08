"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStorylines } from "@/hooks/useStorylines";
import type { Storyline } from "@/lib/convergence/storyline";

// ═══════════════════════════════════════════════════════════════════
//  StorylinePanel — v3.3
// ═══════════════════════════════════════════════════════════════════
//
//  v3.3 changes:
//    - Font sizes bumped 7-9px → 11-14px (readability)
//    - useTranslations('storyline') throughout
//    - Minimum 44px touch targets (accessibility)
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

// ── Relative time helpers (locale-aware via translation keys) ────

function formatTimeAgo(iso: string, t: ReturnType<typeof useTranslations>): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minAgo", { min: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("hoursAgo", { hours });
  const days = Math.floor(hours / 24);
  return t("daysAgo", { days });
}

function formatRemaining(iso: string, t: ReturnType<typeof useTranslations>): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return t("expired");
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return t("hoursLeft", { hours });
  const days = Math.floor(hours / 24);
  return t("daysLeft", { days });
}

// ── Storyline Card ─────────────────────────────────────

function StorylineCard({
  storyline,
  isExpanded,
  onToggle,
}: {
  storyline: Storyline;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("storyline");
  const color = confidenceColor(storyline.peakConfidence);
  const topCategories = storyline.categories.slice(0, 5);

  return (
    <button
      onClick={onToggle}
      className="w-full text-left bg-hud-surface/40 border rounded-md p-2.5 transition-all hover:bg-hud-surface/60 min-h-[44px]"
      style={{ borderColor: `${color}40` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span
            className="font-mono text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {Math.round(storyline.peakConfidence * 100)}%
          </span>
          <span className="font-mono text-[11px] text-hud-muted">
            {t("snapshots", { count: storyline.snapshots.length })}
          </span>
        </div>
        <span className="font-mono text-[11px] text-hud-muted">
          {formatRemaining(storyline.expiresAt, t)}
        </span>
      </div>

      {/* Headline */}
      <div className="font-mono text-[13px] text-hud-text leading-snug mb-2 line-clamp-2">
        {storyline.headline}
      </div>

      {/* Categories + regions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {topCategories.map((cat) => (
          <span
            key={cat}
            className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-hud-base/50 text-hud-muted"
          >
            {CATEGORY_ICONS[cat] || "\u25c6"} {cat}
          </span>
        ))}
        <span className="font-mono text-[10px] text-hud-muted ml-auto">
          {"\ud83d\udccd"} {storyline.affectedRegions.join(",")}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-hud-muted">
        <span>{t("created", { time: formatTimeAgo(storyline.createdAt, t) })}</span>
        <span className="text-hud-border">|</span>
        <span>{t("lastActivity", { time: formatTimeAgo(storyline.lastActivityAt, t) })}</span>
      </div>

      {/* Expanded: snapshot timeline */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-hud-border/30 fade-slide-in">
          <div className="font-mono text-[11px] text-hud-accent mb-1.5 tracking-wider">
            {"\u2588"} {t("snapshotTimeline")}
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
                    className="flex items-start gap-2 text-[11px] font-mono"
                  >
                    <span
                      className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: sc }}
                    />
                    <span className="text-hud-muted shrink-0">
                      {formatTimeAgo(snap.createdAt, t)}
                    </span>
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded font-bold"
                      style={{ backgroundColor: `${sc}20`, color: sc }}
                    >
                      {Math.round(snap.confidence * 100)}%
                    </span>
                    <span className="text-hud-text leading-tight line-clamp-1 flex-1">
                      {snap.signals[0]?.title ?? "\u2014"}
                    </span>
                  </div>
                );
              })}
            {storyline.snapshots.length > 6 && (
              <span className="font-mono text-[10px] text-hud-muted">
                {t("olderSnapshots", { count: storyline.snapshots.length - 6 })}
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

// ── Empty State ────────────────────────────────────────

function EmptyState() {
  const t = useTranslations("storyline");
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
      <div className="w-12 h-12 rounded-full border border-hud-border/40 flex items-center justify-center mb-3">
        <span className="text-2xl opacity-40">{"\ud83d\udcd6"}</span>
      </div>
      <span className="font-mono text-[12px] text-hud-muted">{t("empty")}</span>
      <span className="font-mono text-[10px] text-hud-muted/60 mt-1">
        {t("emptyHint")}
      </span>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────

export function StorylinePanel() {
  const t = useTranslations("storyline");
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
      <div className="px-3 py-2 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[12px] flex items-center gap-2 font-bold tracking-wider">
          <span className="text-hud-accent inline-block w-2 h-2 rounded-full bg-hud-accent/60" />
          {t("title")}
        </span>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="font-mono text-[10px] text-hud-muted animate-pulse">
              {t("loading")}
            </span>
          )}
          <span className="font-mono text-[11px] text-hud-muted">
            {t("active", { count })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 scrollbar-hide">
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
