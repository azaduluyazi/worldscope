"use client";

import { useState } from "react";
import { usePredictionMarkets } from "@/hooks/usePredictionMarkets";
import { useTournament } from "@/hooks/useTournament";

/**
 * Weekly Prediction Tournament panel.
 * Users guess market outcomes and earn points based on confidence.
 */
export function TournamentPanel() {
  const { markets, isLoading, isError } = usePredictionMarkets();
  const { predictions, submitPrediction, getScore, weekDates } = useTournament();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[9px] text-hud-muted animate-pulse">
          LOADING TOURNAMENT...
        </span>
      </div>
    );
  }

  if (isError || markets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[9px] text-hud-muted">
          NO TOURNAMENT DATA
        </span>
      </div>
    );
  }

  const score = getScore();
  const predictedCount = Object.keys(predictions).length;
  const weekStart = weekDates.start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const weekEnd = weekDates.end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="flex flex-col gap-1 p-2">
        {/* Header */}
        <div className="bg-hud-surface/70 border border-hud-accent/30 rounded px-2.5 py-2 mb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] text-hud-accent uppercase tracking-widest">
              This Week&apos;s Tournament
            </span>
            <span className="font-mono text-[8px] text-hud-muted">
              {weekStart} - {weekEnd}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[8px] text-hud-muted">SCORE</span>
              <span
                className="font-mono text-[12px] font-bold"
                style={{ color: score >= 0 ? "#00ff88" : "#ff4757" }}
              >
                {score >= 0 ? "+" : ""}
                {score}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[8px] text-hud-muted">BETS</span>
              <span className="font-mono text-[11px] text-hud-text font-bold">
                {predictedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Markets */}
        {markets.slice(0, 15).map((market) => (
          <TournamentMarketCard
            key={market.id}
            marketId={market.id}
            question={market.question}
            probability={market.probability}
            category={market.category}
            userPrediction={predictions[market.id] ?? null}
            onSubmit={submitPrediction}
          />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────── */

interface MarketCardProps {
  marketId: string;
  question: string;
  probability: number;
  category: string;
  userPrediction: {
    prediction: "yes" | "no";
    confidence: number;
    timestamp: string;
  } | null;
  onSubmit: (id: string, prediction: "yes" | "no", confidence: number) => void;
}

function TournamentMarketCard({
  marketId,
  question,
  probability,
  category,
  userPrediction,
  onSubmit,
}: MarketCardProps) {
  const [confidence, setConfidence] = useState(50);
  const pct = Math.round(probability * 100);

  // User agrees with market if both say yes (>50%) or both say no
  const userAgreesWithMarket =
    userPrediction &&
    ((userPrediction.prediction === "yes" && pct >= 50) ||
      (userPrediction.prediction === "no" && pct < 50));

  const borderColor = userPrediction
    ? userAgreesWithMarket
      ? "border-[#00ff88]/40"
      : "border-[#ffd000]/40"
    : "border-hud-border/50";

  return (
    <div
      className={`bg-hud-surface/50 border ${borderColor} rounded px-2.5 py-2 transition-all`}
    >
      {/* Question + market probability */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-mono text-[9px] text-hud-text leading-tight line-clamp-2">
          {question}
        </p>
        <span
          className="font-mono text-[10px] font-bold shrink-0"
          style={{
            color: pct >= 70 ? "#00ff88" : pct >= 40 ? "#ffd000" : "#ff4757",
          }}
        >
          {pct}%
        </span>
      </div>

      {/* Category label */}
      <span className="font-mono text-[7px] text-hud-muted uppercase">
        {category || "general"}
      </span>

      {userPrediction ? (
        /* After prediction: show the bet */
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{
              backgroundColor:
                userPrediction.prediction === "yes"
                  ? "rgba(0,255,136,0.15)"
                  : "rgba(255,71,87,0.15)",
              color:
                userPrediction.prediction === "yes" ? "#00ff88" : "#ff4757",
            }}
          >
            {userPrediction.prediction.toUpperCase()}
          </span>
          <span className="font-mono text-[8px] text-hud-muted">
            {userPrediction.confidence}pts
          </span>
          <span
            className="font-mono text-[7px] ml-auto"
            style={{
              color: userAgreesWithMarket ? "#00ff88" : "#ffd000",
            }}
          >
            {userAgreesWithMarket ? "WITH MARKET" : "AGAINST MARKET"}
          </span>
        </div>
      ) : (
        /* Prediction input */
        <div className="mt-1.5">
          {/* Confidence slider */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="font-mono text-[7px] text-hud-muted w-6">
              {confidence}
            </span>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="flex-1 h-1 appearance-none bg-hud-border/30 rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5
                [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-hud-accent"
            />
            <span className="font-mono text-[7px] text-hud-muted">pts</span>
          </div>

          {/* YES / NO buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={() => onSubmit(marketId, "yes", confidence)}
              className="flex-1 font-mono text-[9px] font-bold py-1 rounded
                bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30
                hover:bg-[#00ff88]/20 transition-colors cursor-pointer"
            >
              YES
            </button>
            <button
              onClick={() => onSubmit(marketId, "no", confidence)}
              className="flex-1 font-mono text-[9px] font-bold py-1 rounded
                bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/30
                hover:bg-[#ff4757]/20 transition-colors cursor-pointer"
            >
              NO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
