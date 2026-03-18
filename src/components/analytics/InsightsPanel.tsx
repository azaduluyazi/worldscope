"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { SEVERITY_COLORS } from "@/types/intel";
import type { Severity } from "@/types/intel";
import type { TimeRange } from "@/hooks/useAnalytics";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Anomaly {
  type: string;
  description: string;
  severity: Severity;
  score: number;
}

interface Entity {
  name: string;
  type: "person" | "organization" | "location" | "event";
  count: number;
}

interface Sentiment {
  overall: "negative" | "neutral" | "positive";
  score: number;
  distribution: { negative: number; neutral: number; positive: number };
}

interface InsightsData {
  anomalies: Anomaly[];
  entities: Entity[];
  sentiment: Sentiment;
  meta: { analyzedEvents: number };
}

const ENTITY_ICONS: Record<string, string> = {
  organization: "🏛️",
  location: "📍",
  event: "⚡",
  person: "👤",
};

const SENTIMENT_COLORS = {
  negative: "#ff4757",
  neutral: "#5a7a9a",
  positive: "#00ff88",
};

interface InsightsPanelProps {
  hours: TimeRange;
}

export function InsightsPanel({ hours }: InsightsPanelProps) {
  const t = useTranslations("insights");
  const { data, isLoading } = useSWR<InsightsData>(
    `/api/intel/insights?hours=${hours}`,
    fetcher,
    { refreshInterval: 300_000, dedupingInterval: 120_000 }
  );

  if (isLoading) {
    return (
      <div className="bg-hud-surface border border-hud-border rounded-md p-4">
        <div className="font-mono text-[9px] text-hud-accent animate-pulse">◆ {t("title")}...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Anomalies */}
      <div className="bg-hud-surface border border-hud-border rounded-md p-4">
        <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
          ◆ {t("anomalies")}
        </div>
        {data.anomalies.length > 0 ? (
          <div className="space-y-2">
            {data.anomalies.slice(0, 5).map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded border"
                style={{
                  borderColor: `${SEVERITY_COLORS[a.severity]}30`,
                  backgroundColor: `${SEVERITY_COLORS[a.severity]}08`,
                }}
              >
                <span
                  className="font-mono text-[7px] font-bold px-1 py-0.5 rounded shrink-0"
                  style={{ color: SEVERITY_COLORS[a.severity], backgroundColor: `${SEVERITY_COLORS[a.severity]}15` }}
                >
                  {a.type === "spike" ? t("spike") : a.type === "severity_shift" ? t("severityShift") : t("geoCluster")}
                </span>
                <span className="font-mono text-[8px] text-hud-muted">{a.description}</span>
                <span className="font-mono text-[7px] text-hud-accent ml-auto shrink-0">{a.score}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[9px] text-hud-muted text-center py-3">{t("noAnomalies")}</p>
        )}
      </div>

      {/* Entities */}
      <div className="bg-hud-surface border border-hud-border rounded-md p-4">
        <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
          ◆ {t("entities")}
        </div>
        <div className="flex flex-wrap gap-1">
          {data.entities.slice(0, 15).map((e) => (
            <span
              key={e.name}
              className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-hud-border bg-hud-panel text-hud-text"
              title={`${e.type}: ${e.count} mentions`}
            >
              {ENTITY_ICONS[e.type] || "📌"} {e.name}
              <span className="text-hud-muted ml-1">{e.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Sentiment */}
      {data.sentiment && (
        <div className="bg-hud-surface border border-hud-border rounded-md p-4">
          <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
            ◆ {t("sentiment")}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="font-mono text-[14px] font-bold"
              style={{ color: SENTIMENT_COLORS[data.sentiment.overall] }}
            >
              {t(data.sentiment.overall)}
            </span>
            <span className="font-mono text-[9px] text-hud-muted">
              {t("score")}: {data.sentiment.score}
            </span>
          </div>
          {/* Distribution bar */}
          <div className="flex h-2 rounded-full overflow-hidden">
            {(["negative", "neutral", "positive"] as const).map((s) => {
              const total = data.sentiment.distribution.negative + data.sentiment.distribution.neutral + data.sentiment.distribution.positive;
              const pct = total > 0 ? (data.sentiment.distribution[s] / total) * 100 : 33;
              return (
                <div
                  key={s}
                  className="transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: SENTIMENT_COLORS[s] }}
                  title={`${s}: ${data.sentiment.distribution[s]} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[7px]" style={{ color: SENTIMENT_COLORS.negative }}>
              {t("negative")} {data.sentiment.distribution.negative}
            </span>
            <span className="font-mono text-[7px]" style={{ color: SENTIMENT_COLORS.neutral }}>
              {t("neutral")} {data.sentiment.distribution.neutral}
            </span>
            <span className="font-mono text-[7px]" style={{ color: SENTIMENT_COLORS.positive }}>
              {t("positive")} {data.sentiment.distribution.positive}
            </span>
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="font-mono text-[7px] text-hud-muted text-center">
        {t("analyzedEvents")}: {data.meta.analyzedEvents}
      </div>
    </div>
  );
}
