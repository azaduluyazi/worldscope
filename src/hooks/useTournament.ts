"use client";

import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "ws_tournament_predictions";

export interface TournamentPrediction {
  prediction: "yes" | "no";
  confidence: number; // 10-100
  timestamp: string;
  resolved?: boolean;
  correct?: boolean;
}

export type PredictionMap = Record<string, TournamentPrediction>;

export interface LeaderboardEntry {
  rank: number;
  label: string;
  score: number;
}

function loadPredictions(): PredictionMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PredictionMap) : {};
  } catch {
    return {};
  }
}

function savePredictions(predictions: PredictionMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
  } catch {
    // localStorage full or unavailable
  }
}

/** Get the ISO week string for grouping (e.g. "2026-W14") */
function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Get start and end dates for the current ISO week */
function getWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay() || 7; // Monday=1
  const start = new Date(now);
  start.setDate(now.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function useTournament() {
  const [predictions, setPredictions] = useState<PredictionMap>(loadPredictions);

  const submitPrediction = useCallback(
    (marketId: string, prediction: "yes" | "no", confidence: number) => {
      setPredictions((prev) => {
        const next: PredictionMap = {
          ...prev,
          [marketId]: {
            prediction,
            confidence: Math.min(100, Math.max(10, confidence)),
            timestamp: new Date().toISOString(),
          },
        };
        savePredictions(next);
        return next;
      });
    },
    []
  );

  const getScore = useCallback((): number => {
    const weekKey = getWeekKey();
    let score = 0;
    for (const entry of Object.values(predictions)) {
      // Only count predictions from this week
      const entryWeek = getWeekKey(new Date(entry.timestamp));
      if (entryWeek !== weekKey) continue;

      if (entry.resolved) {
        score += entry.correct
          ? entry.confidence
          : -Math.round(entry.confidence / 2);
      }
    }
    return score;
  }, [predictions]);

  const weekDates = useMemo(() => getWeekDates(), []);

  const thisWeekPredictions = useMemo(() => {
    const weekKey = getWeekKey();
    const result: PredictionMap = {};
    for (const [id, entry] of Object.entries(predictions)) {
      if (getWeekKey(new Date(entry.timestamp)) === weekKey) {
        result[id] = entry;
      }
    }
    return result;
  }, [predictions]);

  const leaderboard = useMemo((): LeaderboardEntry[] => {
    // Local-only leaderboard — just the current user for now
    const score = getScore();
    return [{ rank: 1, label: "You", score }];
  }, [getScore]);

  return {
    predictions: thisWeekPredictions,
    submitPrediction,
    getScore,
    leaderboard,
    weekDates,
  };
}
