"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";

/* ── types ── */
interface EquityData {
  quote: {
    current: number;
    change: number;
    percentChange: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
  } | null;
  profile: {
    name: string;
    exchange: string;
    industry: string;
    country: string;
    logo: string;
    weburl: string;
    marketCap: number;
  } | null;
  target: {
    targetHigh: number;
    targetLow: number;
    targetMean: number;
    targetMedian: number;
  } | null;
  recommendations: Array<{
    period: string;
    buy: number;
    hold: number;
    sell: number;
    strongBuy: number;
    strongSell: number;
  }>;
  news: Array<{
    headline: string;
    source: string;
    url: string;
    datetime: number;
  }>;
}

interface EquityResearchPanelProps {
  className?: string;
}

/* ── helpers ── */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatPrice(n: number | undefined | null): string {
  if (n == null) return "--";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMarketCap(m: number | undefined | null): string {
  if (!m) return "--";
  if (m >= 1000) return `$${(m / 1000).toFixed(1)}T`;
  if (m >= 1) return `$${m.toFixed(1)}B`;
  return `$${(m * 1000).toFixed(0)}M`;
}

/* ── component ── */
export function EquityResearchPanel({ className = "" }: EquityResearchPanelProps) {
  const [symbol, setSymbol] = useState("");
  const [activeSymbol, setActiveSymbol] = useState("");

  const { data, isLoading } = useSWR<EquityData>(
    activeSymbol ? `/api/equity?symbol=${activeSymbol}` : null,
    fetcher,
    { refreshInterval: 60_000 },
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = symbol.trim().toUpperCase();
      if (trimmed) setActiveSymbol(trimmed);
    },
    [symbol],
  );

  const quote = data?.quote;
  const profile = data?.profile;
  const target = data?.target;
  const rec = data?.recommendations?.[0];
  const news = data?.news ?? [];

  const changeColor = (quote?.change ?? 0) >= 0 ? "#00ff88" : "#ff4757";

  return (
    <div className={`h-full overflow-auto custom-scrollbar flex flex-col ${className}`}>
      {/* header */}
      <div className="sticky top-0 z-10 bg-hud-panel border-b border-hud-border/50 px-2.5 py-1.5">
        <span className="font-mono text-[9px] text-hud-accent tracking-widest uppercase">
          Equity Research
        </span>
      </div>

      {/* search */}
      <form onSubmit={handleSearch} className="flex gap-1 px-2.5 py-2">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="SYMBOL (e.g. AAPL)"
          className="flex-1 bg-hud-surface/50 border border-hud-border/50 rounded px-2 py-1 font-mono text-[9px] text-hud-text placeholder:text-hud-muted/50 outline-none focus:border-hud-accent/50"
        />
        <button
          type="submit"
          className="bg-hud-accent/20 border border-hud-accent/40 rounded px-3 py-1 font-mono text-[9px] text-hud-accent hover:bg-hud-accent/30 transition-colors"
        >
          SCAN
        </button>
      </form>

      {/* loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-[9px] text-hud-accent animate-pulse">
            SCANNING...
          </span>
        </div>
      )}

      {/* no data / no symbol */}
      {!activeSymbol && !isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-[9px] text-hud-muted">
            ENTER SYMBOL TO BEGIN
          </span>
        </div>
      )}

      {/* results */}
      {activeSymbol && data && !isLoading && (
        <div className="flex flex-col gap-2 px-2.5 pb-2">
          {/* company info */}
          {profile && (
            <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2">
              <div className="font-mono text-[10px] text-hud-text font-bold">
                {profile.name}
              </div>
              <div className="font-mono text-[8px] text-hud-muted mt-0.5">
                {activeSymbol} &middot; {profile.exchange} &middot; {profile.industry}
              </div>
              <div className="font-mono text-[8px] text-hud-muted">
                MCap: {formatMarketCap(profile.marketCap)}
              </div>
            </div>
          )}

          {/* price */}
          {quote && (
            <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[14px] font-bold text-hud-text">
                  ${formatPrice(quote.current)}
                </span>
                <span className="font-mono text-[10px] font-bold" style={{ color: changeColor }}>
                  {quote.change >= 0 ? "+" : ""}
                  {formatPrice(quote.change)} ({quote.percentChange >= 0 ? "+" : ""}
                  {quote.percentChange?.toFixed(2)}%)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1.5">
                <span className="font-mono text-[8px] text-hud-muted">
                  HIGH: <span className="text-hud-text">${formatPrice(quote.high)}</span>
                </span>
                <span className="font-mono text-[8px] text-hud-muted">
                  LOW: <span className="text-hud-text">${formatPrice(quote.low)}</span>
                </span>
                <span className="font-mono text-[8px] text-hud-muted">
                  OPEN: <span className="text-hud-text">${formatPrice(quote.open)}</span>
                </span>
                <span className="font-mono text-[8px] text-hud-muted">
                  PREV: <span className="text-hud-text">${formatPrice(quote.previousClose)}</span>
                </span>
              </div>
            </div>
          )}

          {/* analyst targets */}
          {target && (
            <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2">
              <div className="font-mono text-[8px] text-hud-accent tracking-wider mb-1.5">
                ANALYST TARGETS
              </div>
              <div className="flex items-center gap-1 mb-1">
                <span className="font-mono text-[8px] text-hud-muted w-8">
                  ${Math.round(target.targetLow)}
                </span>
                <div className="flex-1 h-[6px] bg-hud-border/30 rounded-full relative overflow-hidden">
                  {/* range bar */}
                  <div
                    className="absolute h-full bg-hud-accent/30 rounded-full"
                    style={{
                      left: `${((target.targetLow / target.targetHigh) * 100).toFixed(0)}%`,
                      right: "0%",
                    }}
                  />
                  {/* mean marker */}
                  <div
                    className="absolute top-0 h-full w-[2px] bg-hud-accent"
                    style={{
                      left: `${((target.targetMean / target.targetHigh) * 100).toFixed(0)}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-[8px] text-hud-muted w-8 text-right">
                  ${Math.round(target.targetHigh)}
                </span>
              </div>
              <div className="font-mono text-[8px] text-hud-muted text-center">
                MEAN: <span className="text-hud-accent">${formatPrice(target.targetMean)}</span>
                {" "}&middot;{" "}
                MEDIAN: <span className="text-hud-text">${formatPrice(target.targetMedian)}</span>
              </div>
            </div>
          )}

          {/* recommendations */}
          {rec && (
            <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2">
              <div className="font-mono text-[8px] text-hud-accent tracking-wider mb-1.5">
                RECOMMENDATIONS ({rec.period})
              </div>
              {(() => {
                const total = rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell || 1;
                const segments = [
                  { label: "STRONG BUY", count: rec.strongBuy, color: "#00ff88" },
                  { label: "BUY", count: rec.buy, color: "#00c96a" },
                  { label: "HOLD", count: rec.hold, color: "#ffd000" },
                  { label: "SELL", count: rec.sell, color: "#ff8c00" },
                  { label: "STRONG SELL", count: rec.strongSell, color: "#ff4757" },
                ];
                return (
                  <>
                    <div className="flex h-[6px] rounded-full overflow-hidden mb-1.5">
                      {segments.map((s) => (
                        <div
                          key={s.label}
                          className="h-full"
                          style={{
                            width: `${((s.count / total) * 100).toFixed(1)}%`,
                            backgroundColor: s.color,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {segments
                        .filter((s) => s.count > 0)
                        .map((s) => (
                          <span key={s.label} className="font-mono text-[7px]" style={{ color: s.color }}>
                            {s.label}: {s.count}
                          </span>
                        ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* news */}
          {news.length > 0 && (
            <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2">
              <div className="font-mono text-[8px] text-hud-accent tracking-wider mb-1.5">
                LATEST NEWS
              </div>
              <div className="flex flex-col gap-1.5">
                {news.slice(0, 5).map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:text-hud-accent transition-colors"
                  >
                    <div className="font-mono text-[9px] text-hud-text leading-tight line-clamp-2">
                      {item.headline}
                    </div>
                    <div className="font-mono text-[7px] text-hud-muted mt-0.5">
                      {item.source} &middot;{" "}
                      {new Date(item.datetime * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
