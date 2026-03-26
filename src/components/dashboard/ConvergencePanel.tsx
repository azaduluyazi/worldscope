"use client";

import { useState, useMemo } from "react";
import { useConvergence } from "@/hooks/useConvergence";
import type { Convergence, ConvergenceSignal, ImpactLink } from "@/lib/convergence/types";

// ── Confidence colors ──────────────────────────────────

function confidenceColor(c: number): string {
  if (c >= 0.85) return "#ff4757"; // red — critical
  if (c >= 0.70) return "#ffd000"; // yellow — high
  if (c >= 0.50) return "#00e5ff"; // cyan — elevated
  return "#00ff88";                // green — low
}

function confidenceLabel(c: number): string {
  if (c >= 0.85) return "CRITICAL";
  if (c >= 0.70) return "HIGH";
  if (c >= 0.50) return "ELEVATED";
  return "LOW";
}

// ── Type labels ────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  geopolitical: "GEOPOLITICAL",
  economic_cascade: "ECONOMIC CASCADE",
  cyber_infrastructure: "CYBER INFRA",
  humanitarian: "HUMANITARIAN",
  environmental: "ENVIRONMENTAL",
  multi_signal: "MULTI-SIGNAL",
};

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

// ── Impact Chain Arrows ────────────────────────────────

function ImpactChainDisplay({ links }: { links: ImpactLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1.5">
      {links.slice(0, 3).map((link, i) => (
        <div
          key={i}
          className="flex items-center gap-0.5 text-[7px] font-mono"
          title={link.description}
        >
          <span className="text-hud-text uppercase">{link.from}</span>
          <span className="text-hud-accent">{"\u2192"}</span>
          <span className="text-hud-text uppercase">{link.to}</span>
          <span className="text-hud-muted">
            ({Math.round(link.confidence * 100)}%)
          </span>
          {i < Math.min(links.length, 3) - 1 && (
            <span className="text-hud-border mx-0.5">{"\u2502"}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Signal List ────────────────────────────────────────

function SignalList({ signals }: { signals: ConvergenceSignal[] }) {
  return (
    <div className="space-y-0.5 mt-1.5">
      {signals.slice(0, 5).map((signal, i) => (
        <div
          key={i}
          className="flex items-start gap-1.5 text-[8px] font-mono"
        >
          <span className="shrink-0 mt-px">
            {CATEGORY_ICONS[signal.category] || "\u25c6"}
          </span>
          <span className="text-hud-text leading-tight line-clamp-1 flex-1">
            {signal.title}
          </span>
          <span
            className="shrink-0 px-1 py-px rounded text-[6px] font-bold uppercase"
            style={{
              backgroundColor: `${confidenceColor(signal.reliability)}20`,
              color: confidenceColor(signal.reliability),
            }}
          >
            {signal.role}
          </span>
        </div>
      ))}
      {signals.length > 5 && (
        <span className="text-[7px] text-hud-muted font-mono">
          +{signals.length - 5} more signals
        </span>
      )}
    </div>
  );
}

// ── Timeline Display ───────────────────────────────────

function TimelineDisplay({ timeline }: { timeline: { start: string; end: string } }) {
  const start = new Date(timeline.start);
  const end = new Date(timeline.end);
  const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-1 mt-1 text-[7px] font-mono text-hud-muted">
      <span>{"\u23f0"}</span>
      <span>{formatTime(start)}</span>
      <span className="text-hud-accent">{"\u2192"}</span>
      <span>{formatTime(end)}</span>
      <span className="text-hud-border">|</span>
      <span>{durationMin}min span</span>
    </div>
  );
}

// ── Convergence Card ───────────────────────────────────

function ConvergenceCard({
  convergence,
  isExpanded,
  onToggle,
}: {
  convergence: Convergence;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = confidenceColor(convergence.confidence);
  const label = confidenceLabel(convergence.confidence);

  return (
    <button
      onClick={onToggle}
      className="w-full text-left bg-hud-surface/40 border rounded-md p-2 transition-all hover:bg-hud-surface/60"
      style={{ borderColor: `${color}40` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-[8px] font-bold text-hud-text tracking-wider">
            {TYPE_LABELS[convergence.type] || convergence.type.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono text-[7px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {label} {Math.round(convergence.confidence * 100)}%
          </span>
          <span className="font-mono text-[7px] text-hud-muted">
            {convergence.signals.length} signals
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-1.5 h-1 bg-hud-border/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${convergence.confidence * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Region + Location */}
      <div className="flex items-center gap-2 mt-1 text-[7px] font-mono text-hud-muted">
        <span>
          {"\ud83d\udccd"} {convergence.location.lat.toFixed(1)}\u00b0, {convergence.location.lng.toFixed(1)}\u00b0
        </span>
        <span className="text-hud-border">|</span>
        <span>{convergence.affectedRegions.join(", ")}</span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-hud-border/30 fade-slide-in">
          {/* Impact chain */}
          <ImpactChainDisplay links={convergence.impactChain} />

          {/* Timeline */}
          <TimelineDisplay timeline={convergence.timeline} />

          {/* Signal list */}
          <SignalList signals={convergence.signals} />

          {/* AI Narrative */}
          {convergence.narrative && (
            <div className="mt-2 p-1.5 bg-hud-base/50 rounded border border-hud-border/20">
              <span className="font-mono text-[7px] text-hud-accent block mb-0.5">
                {"\u2588"} AI ANALYSIS
              </span>
              <p className="font-mono text-[8px] text-hud-text leading-relaxed">
                {convergence.narrative}
              </p>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ── Empty State ────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
      <div className="w-10 h-10 rounded-full border border-hud-border/40 flex items-center justify-center mb-2">
        <span className="text-lg opacity-40">{"\u269b\ufe0f"}</span>
      </div>
      <span className="font-mono text-[9px] text-hud-muted">NO ACTIVE CONVERGENCES</span>
      <span className="font-mono text-[7px] text-hud-muted/60 mt-0.5">
        Multi-signal correlations appear here when detected
      </span>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────

export function ConvergencePanel() {
  const { convergences, metadata, isLoading } = useConvergence({
    minConfidence: 0.4,
    refreshInterval: 60_000,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...convergences].sort((a, b) => b.confidence - a.confidence),
    [convergences]
  );

  const highCount = sorted.filter((c) => c.confidence >= 0.7).length;

  return (
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[9px] flex items-center gap-1.5">
          {highCount > 0 ? (
            <span className="text-severity-critical live-glow inline-block w-1.5 h-1.5 rounded-full bg-severity-critical" />
          ) : (
            <span className="text-hud-accent inline-block w-1.5 h-1.5 rounded-full bg-hud-accent/60" />
          )}
          SIGNAL CONVERGENCE
        </span>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="font-mono text-[7px] text-hud-muted animate-pulse">
              SCANNING...
            </span>
          )}
          <span className="font-mono text-[8px] text-hud-muted">
            {sorted.length} active
          </span>
          {highCount > 0 && (
            <span className="font-mono text-[7px] text-severity-critical font-bold">
              {highCount} HIGH
            </span>
          )}
        </div>
      </div>

      {/* Metadata bar */}
      {metadata && (
        <div className="px-3 py-0.5 border-b border-hud-border/50 flex items-center gap-2 text-[7px] font-mono text-hud-muted">
          <span>{metadata.totalSignalsAnalyzed} signals analyzed</span>
          <span className="text-hud-border">|</span>
          <span>
            {new Date(metadata.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 space-y-1.5 scrollbar-hide">
        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          sorted.map((conv) => (
            <ConvergenceCard
              key={conv.id}
              convergence={conv}
              isExpanded={expandedId === conv.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === conv.id ? null : conv.id))
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
