"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
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

// ═══════════════════════════════════════════════════════════════════
//  ConvergencePanel — v3.3
// ═══════════════════════════════════════════════════════════════════
//
//  Changes from v3.2:
//    1. Font sizes bumped from 6-10px → 10-14px (readability)
//    2. All strings routed through useTranslations('convergence')
//    3. Confidence labels + type labels + role labels all translated
//    4. Counter-factual section translated
//    5. Accessibility: larger touch targets (32px min)
//
// ═══════════════════════════════════════════════════════════════════

// ── Confidence colors ──────────────────────────────────

function confidenceColor(c: number): string {
  if (c >= 0.85) return "#ff4757"; // red — critical
  if (c >= 0.70) return "#ffd000"; // yellow — high
  if (c >= 0.50) return "#00e5ff"; // cyan — elevated
  return "#00ff88"; // green — low
}

function confidenceKey(c: number): "critical" | "high" | "elevated" | "low" {
  if (c >= 0.85) return "critical";
  if (c >= 0.70) return "high";
  if (c >= 0.50) return "elevated";
  return "low";
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

// ── Impact Chain Arrows ────────────────────────────────

function ImpactChainDisplay({ links }: { links: ImpactLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {links.slice(0, 3).map((link, i) => (
        <div
          key={i}
          className="flex items-center gap-1 text-[11px] font-mono"
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
  const t = useTranslations("convergence");
  return (
    <div className="space-y-1 mt-2">
      {signals.slice(0, 5).map((signal, i) => (
        <div
          key={i}
          className="flex items-start gap-2 text-[12px] font-mono"
        >
          <span className="shrink-0 mt-0.5 text-[13px]">
            {CATEGORY_ICONS[signal.category] || "\u25c6"}
          </span>
          <span className="text-hud-text leading-snug line-clamp-2 flex-1">
            {signal.title}
          </span>
          <span
            className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
            style={{
              backgroundColor: `${confidenceColor(signal.reliability)}20`,
              color: confidenceColor(signal.reliability),
            }}
          >
            {t(`role.${signal.role}`)}
          </span>
        </div>
      ))}
      {signals.length > 5 && (
        <span className="text-[11px] text-hud-muted font-mono">
          {t("moreSignals", { count: signals.length - 5 })}
        </span>
      )}
    </div>
  );
}

// ── Predictions Display ────────────────────────────────

function PredictionsDisplay({ predictions }: { predictions: ConvergencePrediction[] }) {
  const t = useTranslations("convergence");
  if (!predictions || predictions.length === 0) return null;

  const validatedCount = predictions.filter((p) => p.validated).length;
  const top = predictions.slice(0, 4);

  return (
    <div className="mt-3 p-2 bg-hud-base/30 rounded border border-hud-accent/20">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[11px] text-hud-accent uppercase tracking-wider">
          {"\u25c8"} {t("forwardPredictions")}
        </span>
        {validatedCount > 0 && (
          <span
            className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "#00ff8830", color: "#00ff88" }}
            title={t("validatedTooltip", { count: validatedCount })}
          >
            {"\u2713"} {validatedCount} {t("validated")}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {top.map((p, i) => {
          const expectedHours = Math.round(p.expectedWindowMs / 3_600_000);
          const isValidated = p.validated === true;
          return (
            <div
              key={`${p.triggerEventId}-${i}`}
              className="flex items-center gap-1.5 text-[11px] font-mono"
              title={p.reasoning}
            >
              <span className="shrink-0 text-[12px]">
                {CATEGORY_ICONS[p.predictedCategory] || "\u25c6"}
              </span>
              <span
                className="flex-1 leading-tight uppercase"
                style={{ color: isValidated ? "#00ff88" : "#a8b2c8" }}
              >
                {p.predictedCategory}
                {isValidated && <span className="ml-1">{"\u2713"}</span>}
              </span>
              <span className="shrink-0 text-hud-muted">
                {t("within", { hours: expectedHours })}
              </span>
              <span
                className="shrink-0 px-1.5 py-0.5 rounded font-bold"
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
  const t = useTranslations("convergence");
  const start = new Date(timeline.start);
  const end = new Date(timeline.end);
  const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-hud-muted">
      <span>{"\u23f0"}</span>
      <span>{formatTime(start)}</span>
      <span className="text-hud-accent">{"\u2192"}</span>
      <span>{formatTime(end)}</span>
      <span className="text-hud-border">|</span>
      <span>{t("span", { minutes: durationMin })}</span>
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
  const t = useTranslations("convergence");
  const color = confidenceColor(convergence.confidence);
  const label = t(`confidence.${confidenceKey(convergence.confidence)}`);
  const typeLabel = t(`type.${convergence.type}`);
  const validatedPredictions =
    convergence.predictions?.filter((p) => p.validated).length ?? 0;

  return (
    <button
      onClick={onToggle}
      className="w-full text-left bg-hud-surface/40 border rounded-md p-2.5 transition-all hover:bg-hud-surface/60 min-h-[44px]"
      style={{ borderColor: `${color}40` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-[12px] font-bold text-hud-text tracking-wider truncate">
            {typeLabel}
          </span>
          {/* Track badge: GEO 📍 or TOPIC 💡 — shows which detector
              produced this cluster. Topic clusters come from semantic
              similarity over geo-sparse events (Reddit/HN/YouTube). */}
          {convergence.isTopicCluster ? (
            <span
              className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ backgroundColor: "#8a5cf620", color: "#a855f7" }}
              title={t("topicBadgeTooltip")}
            >
              {"\ud83d\udca1"} {t("topicBadge")}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {validatedPredictions > 0 && (
            <span
              className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "#00ff8830", color: "#00ff88" }}
              title={t("predictedTooltip", { count: validatedPredictions })}
            >
              {"\u2713"} {t("predicted")}
            </span>
          )}
          <span
            className="font-mono text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {label} {Math.round(convergence.confidence * 100)}%
          </span>
          <span className="font-mono text-[11px] text-hud-muted">
            {t("signals", { count: convergence.signals.length })}
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-2 h-1.5 bg-hud-border/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${convergence.confidence * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Region + Location — topic clusters skip coords (sentinel 0,0) */}
      <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-hud-muted">
        {convergence.isTopicCluster ? (
          <span>
            {"\ud83c\udf10"} {t("topicScope")}
          </span>
        ) : (
          <>
            <span>
              {"\ud83d\udccd"} {convergence.location.lat.toFixed(1)}°, {convergence.location.lng.toFixed(1)}°
            </span>
            <span className="text-hud-border">|</span>
            <span>{convergence.affectedRegions.join(", ")}</span>
          </>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-hud-border/30 fade-slide-in">
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
            <div className="mt-3 p-2 bg-hud-base/50 rounded border border-hud-border/20">
              <span className="font-mono text-[10px] text-hud-accent block mb-1 tracking-wider">
                {"\u2588"} {t("aiAnalysis")}
              </span>
              <p className="font-mono text-[12px] text-hud-text leading-relaxed">
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

function CounterFactualCard({ signal }: { signal: CounterFactualSignal }) {
  const t = useTranslations("convergence.counterFactual");
  const color =
    signal.severity === "high"
      ? "#a855f7"
      : signal.severity === "elevated"
        ? "#8a5cf6"
        : "#6b46c1";
  return (
    <div
      className="bg-hud-surface/40 border rounded-md p-2.5"
      style={{ borderColor: `${color}60` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[11px] font-bold tracking-wider" style={{ color }}>
          {"\u26a0"} {t(`kind.${signal.kind}`)}
        </span>
        <span
          className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {t(`severity.${signal.severity}`)}
        </span>
      </div>
      <div className="font-mono text-[12px] text-hud-text leading-snug mb-1.5">
        {t("predictedDidNot", {
          category: signal.prediction.predictedCategory,
          probability: Math.round(signal.prediction.probability * 100),
        })}
      </div>
      <div className="font-mono text-[10px] text-hud-muted leading-relaxed">
        {signal.reasoning}
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────

function EmptyState() {
  const t = useTranslations("convergence");
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
      <div className="w-12 h-12 rounded-full border border-hud-border/40 flex items-center justify-center mb-3">
        <span className="text-2xl opacity-40">{"\u269b\ufe0f"}</span>
      </div>
      <span className="font-mono text-[12px] text-hud-muted">{t("empty")}</span>
      <span className="font-mono text-[10px] text-hud-muted/60 mt-1">
        {t("emptyHint")}
      </span>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────

export function ConvergencePanel() {
  const t = useTranslations("convergence");
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
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden" style={{ contain: "layout style" }}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[12px] flex items-center gap-2 font-bold tracking-wider">
          {highCount > 0 ? (
            <span className="text-severity-critical live-glow inline-block w-2 h-2 rounded-full bg-severity-critical" />
          ) : (
            <span className="text-hud-accent inline-block w-2 h-2 rounded-full bg-hud-accent/60" />
          )}
          {t("title")}
        </span>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="font-mono text-[10px] text-hud-muted animate-pulse">
              {t("scanning")}
            </span>
          )}
          <span className="font-mono text-[11px] text-hud-muted">
            {t("active", { count: sorted.length })}
          </span>
          {highCount > 0 && (
            <span className="font-mono text-[10px] text-severity-critical font-bold">
              {highCount} {t("confidence.high")}
            </span>
          )}
        </div>
      </div>

      {/* Metadata bar */}
      {metadata && (
        <div className="px-3 py-1 border-b border-hud-border/50 flex items-center gap-2 text-[10px] font-mono text-hud-muted">
          <span>{t("signalsAnalyzed", { count: metadata.totalSignalsAnalyzed })}</span>
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 scrollbar-hide">
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
              <div className="pt-3 mt-3 border-t border-hud-border/30">
                <div className="px-1 mb-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-hud-muted">
                    {"\u26a0"} {t("counterFactual.sectionTitle", { count: counterFactuals.length })}
                  </span>
                </div>
                <div className="space-y-1.5">
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
