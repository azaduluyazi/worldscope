"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { getDirection } from "@/types/market";

export function MarketTicker() {
  const { quotes, isLoading } = useMarketData();

  return (
    <div className="absolute bottom-3 left-3 right-3 z-20 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
      {isLoading
        ? Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="glass-panel rounded-md px-3 py-2 animate-pulse"
              >
                <div className="h-2 bg-hud-border rounded w-12 mb-2" />
                <div className="h-4 bg-hud-border rounded w-16" />
              </div>
            ))
        : quotes.map((q) => {
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
                className="glass-panel rounded-md px-3 py-2"
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
    </div>
  );
}
