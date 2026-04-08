"use client";

import useSWR from "swr";

/**
 * Signal Mix Admin Panel.
 *
 * Shows the epistemic health of the convergence pipeline:
 *   - Tier distribution (T1 wire / T2 editorial / T3 specialized / T4 social)
 *   - Top source hitters (to spot floods or dedup bugs)
 *   - Status of the 19 migration-013 feeds (Reddit/HN/YouTube/Bluesky)
 *   - Anomaly banners (red/yellow) when any threshold trips
 *
 * Data comes from /api/admin/signal-mix which is authed by ADMIN_KEY.
 * This component is rendered inside the main /admin page — it piggy-backs
 * on the existing login gate and reuses the HUD theme classes.
 */

interface TierDistribution {
  tier: 1 | 2 | 3 | 4 | "unknown";
  events: number;
  sourceCount: number;
  percentage: number;
}

interface SourceHit {
  source: string;
  count: number;
}

interface NewSourceStatus {
  source: string;
  status: "healthy" | "zero-events" | "missing";
  eventCount: number;
}

interface SignalAnomaly {
  severity: "warning" | "critical";
  code: string;
  message: string;
  sources?: string[];
  metric?: number;
}

interface SignalMixReport {
  windowHours: number;
  totalEvents: number;
  totalSources: number;
  tierDistribution: TierDistribution[];
  topSources: SourceHit[];
  newSourceStatus: NewSourceStatus[];
  anomalies: SignalAnomaly[];
  socialLayerPct: number;
  timestamp: string;
}

interface ApiResponse {
  status: "success" | "error";
  data?: SignalMixReport;
  error?: string;
}

const fetcher = async ([url, adminKey]: [string, string]): Promise<SignalMixReport> => {
  const res = await fetch(url, { headers: { "x-admin-key": adminKey } });
  const json = (await res.json()) as ApiResponse;
  if (json.status !== "success" || !json.data) {
    throw new Error(json.error ?? "Unknown error");
  }
  return json.data;
};

const TIER_LABELS: Record<string, string> = {
  "1": "T1 · Wire / Institutional",
  "2": "T2 · Editorial",
  "3": "T3 · Specialized",
  "4": "T4 · Social / Community",
  unknown: "T? · Unclassified",
};

const TIER_COLORS: Record<string, string> = {
  "1": "text-severity-low",       // green — most reliable
  "2": "text-hud-accent",          // cyan
  "3": "text-severity-medium",     // yellow
  "4": "text-severity-high",       // orange — community
  unknown: "text-hud-muted",
};

export function SignalMixPanel({ adminKey }: { adminKey: string }) {
  const { data, error, isLoading, mutate } = useSWR<SignalMixReport, Error>(
    adminKey ? ["/api/admin/signal-mix?hours=24", adminKey] : null,
    fetcher,
    { refreshInterval: 60_000 } // refresh every minute
  );

  if (isLoading) {
    return (
      <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
        <span className="font-mono text-sm text-hud-accent animate-pulse">
          Loading signal mix...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-hud-surface border border-severity-critical/30 rounded-lg p-6">
        <div className="font-mono text-sm text-severity-critical">
          Failed to load signal mix: {error?.message ?? "Unknown error"}
        </div>
      </div>
    );
  }

  const hasAnomalies = data.anomalies.length > 0;
  const criticalCount = data.anomalies.filter((a) => a.severity === "critical").length;

  return (
    <div className="space-y-6">
      {/* Anomaly banner */}
      {hasAnomalies && (
        <div
          className={`rounded-lg border p-4 ${
            criticalCount > 0
              ? "border-severity-critical/50 bg-severity-critical/10"
              : "border-severity-high/50 bg-severity-high/10"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{criticalCount > 0 ? "🔴" : "🟡"}</span>
            <h3
              className={`font-mono text-sm font-bold tracking-wider ${
                criticalCount > 0 ? "text-severity-critical" : "text-severity-high"
              }`}
            >
              {data.anomalies.length} ANOMAL{data.anomalies.length === 1 ? "Y" : "IES"} DETECTED
            </h3>
          </div>
          <ul className="space-y-2">
            {data.anomalies.map((a, i) => (
              <li key={i} className="font-mono text-xs text-hud-text leading-relaxed">
                <span
                  className={`inline-block px-2 py-0.5 mr-2 rounded text-[10px] ${
                    a.severity === "critical"
                      ? "bg-severity-critical/20 text-severity-critical"
                      : "bg-severity-high/20 text-severity-high"
                  }`}
                >
                  {a.code}
                </span>
                {a.message}
                {a.sources && a.sources.length > 0 && a.sources.length <= 5 && (
                  <div className="mt-1 ml-6 text-hud-muted">
                    → {a.sources.join(", ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          label={`EVENTS (${data.windowHours}H)`}
          value={data.totalEvents.toLocaleString()}
          color="text-hud-accent"
        />
        <StatBox
          label="UNIQUE SOURCES"
          value={data.totalSources.toLocaleString()}
          color="text-hud-accent"
        />
        <StatBox
          label="SOCIAL LAYER %"
          value={`${data.socialLayerPct}%`}
          color={data.socialLayerPct >= 3 ? "text-severity-low" : "text-severity-high"}
        />
        <StatBox
          label="ANOMALIES"
          value={data.anomalies.length}
          color={hasAnomalies ? "text-severity-high" : "text-severity-low"}
        />
      </div>

      {/* Tier distribution */}
      <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-base font-bold text-hud-accent tracking-wider">
            TIER DISTRIBUTION
          </h2>
          <button
            onClick={() => mutate()}
            className="font-mono text-xs px-3 py-1 rounded border border-hud-border text-hud-muted hover:text-hud-accent hover:border-hud-accent/30 transition-colors"
          >
            ↻ REFRESH
          </button>
        </div>

        <div className="space-y-3">
          {data.tierDistribution
            .filter((t) => t.events > 0)
            .map((t) => {
              const tierKey = String(t.tier);
              return (
                <div key={tierKey}>
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className={TIER_COLORS[tierKey]}>{TIER_LABELS[tierKey]}</span>
                    <span className="text-hud-muted">
                      {t.events.toLocaleString()} events · {t.sourceCount} sources · {t.percentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-hud-panel rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor(tierKey)}`}
                      style={{ width: `${Math.max(2, t.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Migration 013 status */}
      <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
        <h2 className="font-mono text-base font-bold text-hud-accent tracking-wider mb-4">
          MIGRATION 013 · NEW SOURCES
        </h2>
        <p className="font-mono text-xs text-hud-muted mb-4">
          Reddit · Hacker News · YouTube · Bluesky — the 19 feeds added in the
          social convergence migration. Zero-event sources may be broken or rate-limited.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.newSourceStatus.map((s) => (
            <div
              key={s.source}
              className="flex items-center justify-between font-mono text-xs py-2 px-3 rounded border border-hud-border/50 bg-hud-panel/30"
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    s.status === "healthy"
                      ? "text-severity-low"
                      : s.status === "zero-events"
                        ? "text-severity-high"
                        : "text-severity-critical"
                  }
                >
                  {s.status === "healthy" ? "●" : s.status === "zero-events" ? "○" : "✕"}
                </span>
                <span className="text-hud-text truncate">{s.source}</span>
              </div>
              <span className="text-hud-muted">{s.eventCount.toLocaleString()} ev</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top sources */}
      <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
        <h2 className="font-mono text-base font-bold text-hud-accent tracking-wider mb-4">
          TOP SOURCES
        </h2>
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="text-hud-muted uppercase border-b border-hud-border">
              <th className="text-left py-2 px-3">#</th>
              <th className="text-left py-2 px-3">Source</th>
              <th className="text-right py-2 px-3">Events</th>
              <th className="text-right py-2 px-3">Share</th>
            </tr>
          </thead>
          <tbody>
            {data.topSources.map((s, i) => {
              const pct = data.totalEvents > 0 ? (s.count / data.totalEvents) * 100 : 0;
              return (
                <tr
                  key={s.source}
                  className="border-b border-hud-border/30 hover:bg-hud-panel/30"
                >
                  <td className="py-2 px-3 text-hud-muted">{i + 1}</td>
                  <td className="py-2 px-3 text-hud-text">{s.source}</td>
                  <td className="py-2 px-3 text-right text-hud-accent">
                    {s.count.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-hud-muted">
                    {pct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="font-mono text-[10px] text-hud-muted text-right">
        Updated: {new Date(data.timestamp).toLocaleString()} · Auto-refresh every 60s
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-hud-surface border border-hud-border rounded-lg p-4 text-center">
      <div className={`font-mono text-3xl font-bold ${color}`}>{value}</div>
      <div className="font-mono text-xs text-hud-muted uppercase mt-2 tracking-wider">
        {label}
      </div>
    </div>
  );
}

function barColor(tier: string): string {
  switch (tier) {
    case "1":
      return "bg-severity-low";
    case "2":
      return "bg-hud-accent";
    case "3":
      return "bg-severity-medium";
    case "4":
      return "bg-severity-high";
    default:
      return "bg-hud-muted";
  }
}
