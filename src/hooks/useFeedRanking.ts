"use client";

import { useState, useCallback } from "react";

const RANKING_KEY = "ws_feed_ranking";

type Vote = "up" | "down";
type VoteMap = Record<string, Vote>;

function loadVotes(): VoteMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(RANKING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistVotes(votes: VoteMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RANKING_KEY, JSON.stringify(votes));
}

/**
 * Personalized feed ranking via localStorage.
 * Upvoted items get boosted (+10), downvoted items get buried (-10).
 * No account required.
 */
export function useFeedRanking() {
  const [votes, setVotes] = useState<VoteMap>(() => loadVotes());

  const upvote = useCallback((id: string) => {
    setVotes((prev) => {
      const next = { ...prev };
      if (next[id] === "up") {
        delete next[id]; // toggle off
      } else {
        next[id] = "up";
      }
      persistVotes(next);
      return next;
    });
  }, []);

  const downvote = useCallback((id: string) => {
    setVotes((prev) => {
      const next = { ...prev };
      if (next[id] === "down") {
        delete next[id]; // toggle off
      } else {
        next[id] = "down";
      }
      persistVotes(next);
      return next;
    });
  }, []);

  const clearVote = useCallback((id: string) => {
    setVotes((prev) => {
      const next = { ...prev };
      delete next[id];
      persistVotes(next);
      return next;
    });
  }, []);

  const getRankingWeight = useCallback(
    (id: string): number => {
      const vote = votes[id];
      if (vote === "up") return 10;
      if (vote === "down") return -10;
      return 0;
    },
    [votes]
  );

  return { votes, upvote, downvote, clearVote, getRankingWeight };
}
