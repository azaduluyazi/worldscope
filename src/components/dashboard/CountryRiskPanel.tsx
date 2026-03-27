"use client";

import { useCallback } from "react";
import useSWR from "swr";

/* ── types ── */
interface CIIEntry {
  countryCode: string;
  countryName: string;
  score: number;
}

interface CountryRiskPanelProps {
  onSelectCountry?: (countryCode: string) => void;
  className?: string;
}

/* ── helpers ── */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

const FLAG_OFFSET = 0x1f1e6;
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "\u{1F30D}";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    upper.charCodeAt(0) - 65 + FLAG_OFFSET,
    upper.charCodeAt(1) - 65 + FLAG_OFFSET,
  );
}

function severityLabel(score: number) {
  if (score >= 80) return { label: "CRITICAL", color: "#ff4757", bg: "rgba(255,71,87,0.15)" };
  if (score >= 60) return { label: "HIGH", color: "#ff8c00", bg: "rgba(255,140,0,0.15)" };
  if (score >= 40) return { label: "MEDIUM", color: "#ffd000", bg: "rgba(255,208,0,0.15)" };
  return { label: "LOW", color: "#00ff88", bg: "rgba(0,255,136,0.15)" };
}

function scoreGradient(score: number): string {
  if (score >= 70) return "#ff4757";
  if (score >= 50) return "#ff8c00";
  if (score >= 30) return "#ffd000";
  return "#00ff88";
}

/* ── component ── */
export function CountryRiskPanel({ onSelectCountry, className = "" }: CountryRiskPanelProps) {
  const { data, isLoading, error } = useSWR<{ countries: CIIEntry[] }>(
    "/api/analytics/cii?top=20",
    fetcher,
    { refreshInterval: 30 * 60 * 1000 },
  );

  const handleClick = useCallback(
    (code: string) => {
      onSelectCountry?.(code);
    },
    [onSelectCountry],
  );

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <span className="font-mono text-[9px] text-hud-muted animate-pulse">
          LOADING RISK INDEX...
        </span>
      </div>
    );
  }

  if (error || !data?.countries?.length) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <span className="font-mono text-[9px] text-hud-muted">NO CII DATA</span>
      </div>
    );
  }

  const sorted = [...data.countries].sort((a, b) => b.score - a.score);

  return (
    <div className={`h-full overflow-auto custom-scrollbar ${className}`}>
      {/* header */}
      <div className="sticky top-0 z-10 bg-hud-panel border-b border-hud-border/50 px-2.5 py-1.5 flex items-center justify-between">
        <span className="font-mono text-[9px] text-hud-accent tracking-widest uppercase">
          Country Instability Index
        </span>
        <span className="font-mono text-[8px] text-hud-muted">
          TOP {sorted.length}
        </span>
      </div>

      {/* table header */}
      <div className="grid grid-cols-[24px_1fr_80px_56px] gap-1 px-2.5 py-1 border-b border-hud-border/30">
        <span className="font-mono text-[8px] text-hud-muted">#</span>
        <span className="font-mono text-[8px] text-hud-muted">COUNTRY</span>
        <span className="font-mono text-[8px] text-hud-muted">SCORE</span>
        <span className="font-mono text-[8px] text-hud-muted text-right">STATUS</span>
      </div>

      {/* rows */}
      <div className="flex flex-col">
        {sorted.map((entry, i) => {
          const sev = severityLabel(entry.score);
          return (
            <button
              key={entry.countryCode}
              onClick={() => handleClick(entry.countryCode)}
              className="grid grid-cols-[24px_1fr_80px_56px] gap-1 items-center px-2.5 py-1.5 border-b border-hud-border/20 hover:bg-hud-surface/50 transition-colors text-left"
            >
              {/* rank */}
              <span className="font-mono text-[8px] text-hud-muted">{i + 1}</span>

              {/* flag + name */}
              <span className="font-mono text-[9px] text-hud-text truncate">
                <span className="mr-1">{countryFlag(entry.countryCode)}</span>
                {entry.countryName}
              </span>

              {/* score bar */}
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-[4px] bg-hud-border/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${entry.score}%`,
                      backgroundColor: scoreGradient(entry.score),
                    }}
                  />
                </div>
                <span
                  className="font-mono text-[9px] font-bold w-6 text-right"
                  style={{ color: scoreGradient(entry.score) }}
                >
                  {Math.round(entry.score)}
                </span>
              </div>

              {/* severity badge */}
              <span
                className="font-mono text-[7px] px-1.5 py-0.5 rounded text-right"
                style={{ color: sev.color, backgroundColor: sev.bg }}
              >
                {sev.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
