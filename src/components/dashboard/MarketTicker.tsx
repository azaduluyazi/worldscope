"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { getDirection } from "@/types/market";

function getFearGreedColor(value: number): string {
  if (value <= 25) return "#ff4757"; // Extreme Fear
  if (value <= 45) return "#ffd000"; // Fear
  if (value <= 55) return "#5a7a9a"; // Neutral
  if (value <= 75) return "#00ff88"; // Greed
  return "#00ff88"; // Extreme Greed
}

export function MarketTicker() {
  const { quotes, fearGreed, isLoading } = useMarketData();

  return (
    <div className="absolute bottom-3 left-3 right-3 z-20 flex gap-1.5 overflow-x-auto">
      {isLoading
        ? Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="glass-panel rounded-md px-3 py-2 animate-pulse min-w-[100px]"
              >
                <div className="h-2 bg-hud-border rounded w-12 mb-2" />
                <div className="h-4 bg-hud-border rounded w-16" />
              </div>
            ))
        : (
          <>
            {quotes.map((q) => {
              const dir = getDirection(q.changePct);
              const color =
                dir === "up"
                  ? "text-market-up"
                  : dir === "down"
                  ? "text-market-down"
                  : "text-market-neutral";
              const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "─";

              return (
                <div
                  key={q.symbol}
                  className="glass-panel rounded-md px-3 py-2 min-w-[100px]"
                >
                  <div className="font-mono text-[8px] text-hud-muted">
                    {q.symbol}
                  </div>
                  <div className={`font-mono text-sm font-bold ${color}`}>
                    {q.price >= 1000
                      ? `${(q.price / 1000).toFixed(1)}K`
                      : q.price >= 1
                      ? q.price.toFixed(q.price < 10 ? 4 : 2)
                      : q.price.toFixed(4)}
                  </div>
                  <div className={`font-mono text-[8px] ${color}`}>
                    {arrow} {Math.abs(q.changePct).toFixed(2)}%
                  </div>
                </div>
              );
            })}

            {/* Fear & Greed Index card */}
            {fearGreed && (
              <div className="glass-panel rounded-md px-3 py-2 min-w-[110px]">
                <div className="font-mono text-[8px] text-hud-muted">
                  FEAR/GREED
                </div>
                <div
                  className="font-mono text-sm font-bold"
                  style={{ color: getFearGreedColor(fearGreed.value) }}
                >
                  {fearGreed.value}
                </div>
                <div
                  className="font-mono text-[8px]"
                  style={{ color: getFearGreedColor(fearGreed.value) }}
                >
                  {fearGreed.classification}
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
}
