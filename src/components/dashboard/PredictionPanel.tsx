"use client";

import { usePredictionMarkets } from "@/hooks/usePredictionMarkets";

/**
 * Prediction Markets panel — Polymarket data display.
 * Shows active prediction markets with probability bars.
 */
export function PredictionPanel() {
  const { markets, isLoading, isError } = usePredictionMarkets();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING MARKETS...</span>
      </div>
    );
  }

  if (isError || markets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[9px] text-hud-muted">NO MARKET DATA</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="flex flex-col gap-1 p-2">
        {markets.slice(0, 20).map((market) => {
          const pct = Math.round(market.probability * 100);
          const color = pct >= 70 ? "#00ff88" : pct >= 40 ? "#ffd000" : "#ff4757";

          return (
            <a
              key={market.id}
              href={market.url || `https://polymarket.com/event/${market.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-hud-surface/50 border border-hud-border/50 rounded px-2.5 py-2 hover:border-hud-accent/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="font-mono text-[9px] text-hud-text leading-tight group-hover:text-hud-accent transition-colors line-clamp-2">
                  {market.question}
                </p>
                <span
                  className="font-mono text-[11px] font-bold shrink-0"
                  style={{ color }}
                >
                  {pct}%
                </span>
              </div>

              {/* Probability bar */}
              <div className="h-1 bg-hud-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>

              <div className="flex justify-between mt-1">
                <span className="font-mono text-[7px] text-hud-muted uppercase">
                  {market.category || "general"}
                </span>
                {market.volume != null && (
                  <span className="font-mono text-[7px] text-hud-muted">
                    VOL ${market.volume > 1000000 ? (market.volume / 1000000).toFixed(1) + "M" : market.volume > 1000 ? (market.volume / 1000).toFixed(0) + "K" : market.volume}
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
