"use client";

import { useEffect, useState, useMemo } from "react";
import { useConvergence } from "@/hooks/useConvergence";
import { useConvergenceTelemetry } from "@/hooks/useConvergenceTelemetry";
import { useCounterFactuals } from "@/hooks/useCounterFactuals";
import type {
  Convergence,
  ConvergencePrediction,
  ConvergenceSignal,
  ImpactLink,
} from "@/lib/convergence/types";
import type { CounterFactualSignal } from "@/lib/convergence/counter-factual";

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

// ── Predictions Display ────────────────────────────────

function PredictionsDisplay({ predictions }: { predictions: ConvergencePrediction[] }) {
  if (!predictions || predictions.length === 0) return null;

  const validatedCount = predictions.filter((p) => p.validated).length;
  const top = predictions.slice(0, 4);

  return (
    <div className="mt-2 p-1.5 bg-hud-base/30 rounded border border-hud-accent/20">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[7px] text-hud-accent uppercase tracking-wider">
          {"\u25c8"} Forward Predictions
        </span>
        {validatedCount > 0 && (
          <span
            className="font-mono text-[6px] font-bold px-1 py-px rounded"
            style={{ backgroundColor: "#00ff8830", color: "#00ff88" }}
            title={`${validatedCount} prediction${validatedCount > 1 ? "s" : ""} confirmed by subsequent events`}
          >
            {"\u2713"} {validatedCount} VALIDATED
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {top.map((p, i) => {
          const expectedHours = Math.round(p.expectedWindowMs / 3_600_000);
          const isValidated = p.validated === true;
          return (
            <div
              key={`${p.triggerEventId}-${i}`}
              className="flex items-start gap-1 text-[7px] font-mono"
              title={p.reasoning}
            >
              <span className="shrink-0 mt-px">
                {CATEGORY_ICONS[p.predictedCategory] || "\u25c6"}
              </span>
              <span
                className="flex-1 leading-tight uppercase"
                style={{ color: isValidated ? "#00ff88" : "#a8b2c8" }}
              >
                {p.predictedCategory}
                {isValidated && <span className="ml-1">{"\u2713"}</span>}
              </span>
              <span className="shrink-0 text-hud-muted">{expectedHours}h</span>
              <span
                className="shrink-0 px-1 rounded font-bold"
                style={{
                  backgroundColor: `${confidenceColor(p.probability)}20`,
                  color: confidenceColor(p.probability),
                }}
              >
                {Math.round(p.probability * 100)}%
              </span>
            </div>
          );
        })}
      </div>
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
  const validatedPredictions =
    convergence.predictions?.filter((p) => p.validated).length ?? 0;

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
          {validatedPredictions > 0 && (
            <span
              className="font-mono text-[6px] font-bold px-1 py-0.5 rounded"
              style={{ backgroundColor: "#00ff8830", color: "#00ff88" }}
              title={`${validatedPredictions} forward prediction${validatedPredictions > 1 ? "s" : ""} validated`}
            >
              {"\u2713"} PREDICTED
            </span>
          )}
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

          {/* Forward predictions */}
          {convergence.predictions && convergence.predictions.length > 0 && (
            <PredictionsDisplay predictions={convergence.predictions} />
          )}

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

// ── Counter-Factual Card ───────────────────────────────

const CF_KIND_LABEL: Record<CounterFactualSignal["kind"], string> = {
  missing_reaction: "MISSING REACTION",
  absent_signal: "ABSENT SIGNAL",
  premature_silence: "EARLY WARNING",
};

function CounterFactualCard({ signal }: { signal: CounterFactualSignal }) {
  // Counter-factuals get a distinctive violet color so they don't
  // visually compete with positive convergences.
  const color =
    signal.severity === "high"
      ? "#a855f7"
      : signal.severity === "elevated"
        ? "#8a5cf6"
        : "#6b46c1";
  return (
    <div
      className="bg-hud-surface/40 border rounded-md p-2"
      style={{ borderColor: `${color}60` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[8px] font-bold tracking-wider" style={{ color }}>
          {"\u26a0"} {CF_KIND_LABEL[signal.kind]}
        </span>
        <span
          className="font-mono text-[7px] font-bold uppercase px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {signal.severity}
        </span>
      </div>
      <div className="font-mono text-[8px] text-hud-text leading-tight mb-1">
        Predicted{" "}
        <span className="uppercase font-bold" style={{ color }}>
          {signal.prediction.predictedCategory}
        </span>{" "}
        @ {Math.round(signal.prediction.probability * 100)}% — did not appear
      </div>
      <div className="font-mono text-[7px] text-hud-muted leading-relaxed">
        {signal.reasoning}
      </div>
    </div>
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
  const { signals: counterFactuals } = useCounterFactuals({ refreshInterval: 60_000 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const telemetry = useConvergenceTelemetry({ surface: "panel" });

  const sorted = useMemo(
    () => [...convergences].sort((a, b) => b.confidence - a.confidence),
    [convergences]
  );

  // Fire "shown" telemetry for each convergence currently rendered.
  // The hook dedups per session so SWR re-renders don't spam writes.
  useEffect(() => {
    for (const c of sorted) telemetry.trackShown(c);
  }, [sorted, telemetry]);

  const handleToggle = (conv: Convergence) => {
    const willExpand = expandedId !== conv.id;
    setExpandedId((prev) => (prev === conv.id ? null : conv.id));
    if (willExpand) {
      telemetry.trackClick(conv);
      telemetry.trackExpand(conv);
    }
  };

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
        {sorted.length === 0 && counterFactuals.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {sorted.map((conv) => (
              <ConvergenceCard
                key={conv.id}
                convergence={conv}
                isExpanded={expandedId === conv.id}
                onToggle={() => handleToggle(conv)}
              />
            ))}

            {counterFactuals.length > 0 && (
              <div className="pt-2 mt-2 border-t border-hud-border/30">
                <div className="px-1 mb-1">
                  <span className="font-mono text-[7px] uppercase tracking-wider text-hud-muted">
                    {"\u26a0"} Counter-Factual Anomalies — {counterFactuals.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {counterFactuals.slice(0, 5).map((s, i) => (
                    <CounterFactualCard key={`cf-${i}`} signal={s} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
