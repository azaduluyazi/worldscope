"use client";

import { useState, useCallback } from "react";
import type { ScenarioResult } from "@/lib/ai/scenario-engine";

// ── Risk Level Colors ─────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
};

const RISK_BG: Record<string, string> = {
  critical: "rgba(255,71,87,0.15)",
  high: "rgba(255,208,0,0.15)",
  medium: "rgba(0,229,255,0.15)",
  low: "rgba(0,255,136,0.15)",
};

// ── Region Flag Mapping (common) ──────────────────────────

const REGION_FLAGS: Record<string, string> = {
  russia: "\ud83c\uddf7\ud83c\uddfa",
  ukraine: "\ud83c\uddfa\ud83c\udde6",
  china: "\ud83c\udde8\ud83c\uddf3",
  taiwan: "\ud83c\uddf9\ud83c\uddfc",
  iran: "\ud83c\uddee\ud83c\uddf7",
  israel: "\ud83c\uddee\ud83c\uddf1",
  "north korea": "\ud83c\uddf0\ud83c\uddf5",
  "south korea": "\ud83c\uddf0\ud83c\uddf7",
  usa: "\ud83c\uddfa\ud83c\uddf8",
  "united states": "\ud83c\uddfa\ud83c\uddf8",
  europe: "\ud83c\uddea\ud83c\uddfa",
  eu: "\ud83c\uddea\ud83c\uddfa",
  turkey: "\ud83c\uddf9\ud83c\uddf7",
  syria: "\ud83c\uddf8\ud83c\uddfe",
  iraq: "\ud83c\uddee\ud83c\uddf6",
  india: "\ud83c\uddee\ud83c\uddf3",
  pakistan: "\ud83c\uddf5\ud83c\uddf0",
  japan: "\ud83c\uddef\ud83c\uddf5",
  "saudi arabia": "\ud83c\uddf8\ud83c\udde6",
  moldova: "\ud83c\uddf2\ud83c\udde9",
  germany: "\ud83c\udde9\ud83c\uddea",
  france: "\ud83c\uddeb\ud83c\uddf7",
  uk: "\ud83c\uddec\ud83c\udde7",
  "united kingdom": "\ud83c\uddec\ud83c\udde7",
  poland: "\ud83c\uddf5\ud83c\uddf1",
  romania: "\ud83c\uddf7\ud83c\uddf4",
  "middle east": "\ud83c\udf0d",
  "south china sea": "\ud83c\udf0f",
  asia: "\ud83c\udf0f",
  africa: "\ud83c\udf0d",
  "latin america": "\ud83c\udf0e",
};

function getFlag(region: string): string {
  const key = region.toLowerCase().trim();
  return REGION_FLAGS[key] || "\ud83d\udccd";
}

// ── Effect List Component ─────────────────────────────────

function EffectColumn({
  title,
  timeframe,
  effects,
  accentColor,
}: {
  title: string;
  timeframe: string;
  effects: string[];
  accentColor: string;
}) {
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/60">
          {title}
        </span>
      </div>
      <div className="text-[8px] font-mono text-white/30 mb-2">{timeframe}</div>
      <div className="space-y-1.5">
        {effects.map((effect, i) => (
          <div
            key={i}
            className="flex items-start gap-1.5 text-[11px] font-mono leading-tight"
          >
            <span style={{ color: accentColor }} className="mt-0.5 shrink-0">
              {"\u25b8"}
            </span>
            <span className="text-white/80">{effect}</span>
          </div>
        ))}
        {effects.length === 0 && (
          <span className="text-[10px] text-white/20 font-mono italic">
            No data
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

export default function ScenarioAnalysis() {
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    const trimmed = scenario.trim();
    if (trimmed.length < 10) {
      setError("Scenario must be at least 10 characters.");
      return;
    }
    if (trimmed.length > 500) {
      setError("Scenario must be 500 characters or less.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scenarios/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }

      const data: ScenarioResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      analyze();
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#8a5cf6] animate-pulse" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-white/50">
          What-If Scenario Analysis
        </span>
      </div>

      {/* Input Area */}
      <div className="relative">
        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What if Russia invades Moldova?"
          maxLength={500}
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-[12px] font-mono text-white/90 placeholder:text-white/20 resize-none focus:outline-none focus:border-[#8a5cf6]/50 focus:ring-1 focus:ring-[#8a5cf6]/20 transition-colors"
        />
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-white/20">
          {scenario.length}/500
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={analyze}
        disabled={loading || scenario.trim().length < 10}
        className="w-full py-2 px-4 text-[11px] font-mono uppercase tracking-widest rounded-md transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: loading
            ? "rgba(138,92,246,0.1)"
            : "linear-gradient(135deg, rgba(138,92,246,0.3), rgba(138,92,246,0.1))",
          border: "1px solid rgba(138,92,246,0.3)",
          color: loading ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)",
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-3 h-3 border border-[#8a5cf6] border-t-transparent rounded-full animate-spin" />
            Analyzing...
          </span>
        ) : (
          "Analyze Scenario"
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="text-[11px] font-mono text-[#ff4757] bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3 animate-in fade-in duration-500">
          {/* Risk Level + Confidence */}
          <div className="flex items-center justify-between">
            <div
              className="px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
              style={{
                color: RISK_COLORS[result.riskLevel],
                backgroundColor: RISK_BG[result.riskLevel],
                border: `1px solid ${RISK_COLORS[result.riskLevel]}40`,
              }}
            >
              {result.riskLevel} risk
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-white/30 uppercase">
                Confidence
              </span>
              <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${result.confidence}%`,
                    backgroundColor:
                      result.confidence >= 70
                        ? "#00ff88"
                        : result.confidence >= 40
                          ? "#ffd000"
                          : "#ff4757",
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-white/50">
                {result.confidence}%
              </span>
            </div>
          </div>

          {/* Three Effect Columns */}
          <div className="flex gap-4 flex-wrap">
            <EffectColumn
              title="Immediate"
              timeframe="0-48 hours"
              effects={result.immediateEffects}
              accentColor="#ff4757"
            />
            <EffectColumn
              title="Short-Term"
              timeframe="1-4 weeks"
              effects={result.shortTermEffects}
              accentColor="#ffd000"
            />
            <EffectColumn
              title="Long-Term"
              timeframe="1-6 months"
              effects={result.longTermEffects}
              accentColor="#00e5ff"
            />
          </div>

          {/* Affected Regions */}
          {result.affectedRegions.length > 0 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-white/30 mb-1.5">
                Affected Regions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.affectedRegions.map((region, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-white/60"
                  >
                    <span>{getFlag(region)}</span>
                    {region}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Events */}
          {result.relatedEvents.length > 0 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-white/30 mb-1.5">
                Related Current Events
              </div>
              <div className="space-y-1">
                {result.relatedEvents.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-[10px] font-mono text-white/50"
                  >
                    <span className="text-[#8a5cf6] shrink-0">{"\u25c6"}</span>
                    <span>{event}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
