"use client";

import { useSyncExternalStore } from "react";
import useSWR from "swr";

// ── Types (mirrors API response) ──────────────────────────

interface ConflictZoneSlim {
  id: string;
  name: string;
  countries: string[];
  escalationScore: number;
  trend: "escalating" | "stable" | "de-escalating";
  dailyScores: { date: string; score: number }[];
  fatalities: number;
  lastEventAt: string;
  eventCount: number;
}

interface EscalationResponse {
  zones: ConflictZoneSlim[];
  totalConflicts: number;
  escalatingCount: number;
  deescalatingCount: number;
  stableCount: number;
  timestamp: string;
}

// ── Country flag mapping ──────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  UA: "\ud83c\uddfa\ud83c\udde6",
  RU: "\ud83c\uddf7\ud83c\uddfa",
  IL: "\ud83c\uddee\ud83c\uddf1",
  PS: "\ud83c\uddf5\ud83c\uddf8",
  SY: "\ud83c\uddf8\ud83c\uddfe",
  IQ: "\ud83c\uddee\ud83c\uddf6",
  YE: "\ud83c\uddfe\ud83c\uddea",
  SD: "\ud83c\uddf8\ud83c\udde9",
  SS: "\ud83c\uddf8\ud83c\uddf8",
  MM: "\ud83c\uddf2\ud83c\uddf2",
  ET: "\ud83c\uddea\ud83c\uddf9",
  SO: "\ud83c\uddf8\ud83c\uddf4",
  AF: "\ud83c\udde6\ud83c\uddeb",
  LY: "\ud83c\uddf1\ud83c\uddfe",
  CD: "\ud83c\udde8\ud83c\udde9",
  ML: "\ud83c\uddf2\ud83c\uddf1",
  BF: "\ud83c\udde7\ud83c\uddeb",
  NE: "\ud83c\uddf3\ud83c\uddea",
  NG: "\ud83c\uddf3\ud83c\uddec",
  MZ: "\ud83c\uddf2\ud83c\uddfb",
  CM: "\ud83c\udde8\ud83c\uddf2",
  KP: "\ud83c\uddf0\ud83c\uddf5",
  CN: "\ud83c\udde8\ud83c\uddf3",
  TW: "\ud83c\uddf9\ud83c\uddfc",
  IR: "\ud83c\uddee\ud83c\uddf7",
  PK: "\ud83c\uddf5\ud83c\uddf0",
  IN: "\ud83c\uddee\ud83c\uddf3",
  LB: "\ud83c\uddf1\ud83c\udde7",
  HT: "\ud83c\udded\ud83c\uddf9",
  CO: "\ud83c\udde8\ud83c\uddf4",
  MX: "\ud83c\uddf2\ud83c\uddfd",
};

function getFlag(code: string): string {
  return COUNTRY_FLAGS[code] || "\ud83c\udf10";
}

// ── Trend colors/icons ────────────────────────────────────

const TREND_CONFIG = {
  escalating: { color: "#ff4757", arrow: "\u2191", label: "ESCALATING" },
  stable: { color: "#ffd000", arrow: "\u2192", label: "STABLE" },
  "de-escalating": { color: "#00ff88", arrow: "\u2193", label: "DE-ESCALATING" },
} as const;

// ── Sparkline Component ───────────────────────────────────

function MiniSparkline({
  scores,
  trend,
}: {
  scores: { date: string; score: number }[];
  trend: "escalating" | "stable" | "de-escalating";
}) {
  const maxScore = Math.max(...scores.map((s) => s.score), 1);
  const color = TREND_CONFIG[trend].color;

  return (
    <div className="flex items-end gap-px h-4" title="7-day activity">
      {scores.map((s, i) => {
        const height = Math.max(2, (s.score / maxScore) * 16);
        return (
          <div
            key={i}
            className="w-1.5 rounded-t-[1px] transition-all duration-300"
            style={{
              height: `${height}px`,
              backgroundColor: color,
              opacity: 0.3 + (i / scores.length) * 0.7,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Escalation Bar Component ──────────────────────────────

function EscalationBar({ score }: { score: number }) {
  // score is -100 to +100, we map to 0-100% width from center
  const absScore = Math.abs(score);
  const isPositive = score >= 0;
  const color = isPositive
    ? score > 50
      ? "#ff4757"
      : score > 20
        ? "#ffd000"
        : "#ffd000"
    : "#00ff88";

  return (
    <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      {/* Center marker */}
      <div className="absolute left-1/2 top-0 w-px h-full bg-white/10" />
      {/* Score bar */}
      <div
        className="absolute top-0 h-full rounded-full transition-all duration-500"
        style={{
          width: `${absScore / 2}%`,
          backgroundColor: color,
          left: isPositive ? "50%" : `${50 - absScore / 2}%`,
        }}
      />
    </div>
  );
}

// ── Conflict Zone Row ─────────────────────────────────────

function formatTimeSince(isoDate: string, now: number): string {
  const diff = now - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ZoneRow({ zone, now }: { zone: ConflictZoneSlim; now: number }) {
  const trendCfg = TREND_CONFIG[zone.trend];
  const timeSince = formatTimeSince(zone.lastEventAt, now);

  return (
    <div className="group px-2.5 py-2 hover:bg-white/[0.03] rounded-md transition-colors border border-transparent hover:border-white/5">
      {/* Top row: name + trend */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-[11px] font-mono font-bold"
            style={{ color: trendCfg.color }}
          >
            {trendCfg.arrow}
          </span>
          <span className="text-[11px] font-mono font-semibold text-white/80 truncate">
            {zone.name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[8px] font-mono px-1.5 py-0.5 rounded"
            style={{
              color: trendCfg.color,
              backgroundColor: `${trendCfg.color}15`,
              border: `1px solid ${trendCfg.color}30`,
            }}
          >
            {trendCfg.label}
          </span>
        </div>
      </div>

      {/* Country flags + score */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-0.5">
          {zone.countries.slice(0, 5).map((code) => (
            <span key={code} className="text-[10px]" title={code}>
              {getFlag(code)}
            </span>
          ))}
          {zone.countries.length > 5 && (
            <span className="text-[8px] text-white/20 font-mono ml-0.5">
              +{zone.countries.length - 5}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <MiniSparkline scores={zone.dailyScores} trend={zone.trend} />
          <span
            className="text-[10px] font-mono font-bold tabular-nums w-8 text-right"
            style={{ color: trendCfg.color }}
          >
            {zone.escalationScore > 0 ? "+" : ""}
            {zone.escalationScore}
          </span>
        </div>
      </div>

      {/* Escalation bar */}
      <EscalationBar score={zone.escalationScore} />

      {/* Bottom stats */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-white/25">
            {zone.eventCount} events
          </span>
          {zone.fatalities > 0 && (
            <span className="text-[8px] font-mono text-[#ff4757]/40">
              ~{zone.fatalities} est. casualties
            </span>
          )}
        </div>
        <span className="text-[8px] font-mono text-white/20">{timeSince}</span>
      </div>
    </div>
  );
}

// ── Fetcher ───────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Main Component ────────────────────────────────────────

// Tick every 60s. Using useSyncExternalStore keeps SSR snapshot (0) stable
// while the client reads real Date.now() — no React #418 hydration mismatch.
const subscribeMinuteTick = (cb: () => void) => {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
};
const getTickSnapshot = () => Date.now();
const getTickServerSnapshot = () => 0;

export default function EscalationTracker() {
  const now = useSyncExternalStore(subscribeMinuteTick, getTickSnapshot, getTickServerSnapshot);

  const { data, isLoading } = useSWR<EscalationResponse>(
    "/api/conflicts/escalation",
    fetcher,
    {
      refreshInterval: 5 * 60_000, // 5 min refresh
      revalidateOnFocus: true,
      dedupingInterval: 60_000,
    }
  );

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff4757] animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-white/50">
            Conflict Escalation
          </span>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono text-[#ff4757]/60">
              {data.escalatingCount} {"\u2191"}
            </span>
            <span className="text-[8px] font-mono text-[#ffd000]/60">
              {data.stableCount} {"\u2192"}
            </span>
            <span className="text-[8px] font-mono text-[#00ff88]/60">
              {data.deescalatingCount} {"\u2193"}
            </span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-white/[0.02] rounded-md animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!data || data.zones.length === 0) && (
        <div className="text-center py-6">
          <span className="text-[11px] font-mono text-white/20">
            No active conflict zones detected
          </span>
        </div>
      )}

      {/* Conflict zone list */}
      {data && data.zones.length > 0 && (
        <div className="space-y-1">
          {data.zones.map((zone) => (
            <ZoneRow key={zone.id} zone={zone} now={now} />
          ))}
        </div>
      )}

      {/* Footer timestamp */}
      {data?.timestamp && (
        <div className="text-[7px] font-mono text-white/15 text-right pt-1">
          Updated {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
