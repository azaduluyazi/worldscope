"use client";

import { useCallback } from "react";
import { useFeedRanking } from "@/hooks/useFeedRanking";

interface VoteButtonsProps {
  itemId: string;
  compact?: boolean;
}

export function VoteButtons({ itemId, compact = false }: VoteButtonsProps) {
  const { votes, upvote, downvote } = useFeedRanking();
  const currentVote = votes[itemId];

  const handleUpvote = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      upvote(itemId);
    },
    [upvote, itemId]
  );

  const handleDownvote = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      downvote(itemId);
    },
    [downvote, itemId]
  );

  return (
    <span
      className={`inline-flex flex-col items-center gap-0 ${compact ? "text-[9px]" : "text-[11px]"}`}
    >
      <button
        type="button"
        onClick={handleUpvote}
        title="Boost in feed"
        className={`leading-none transition-colors cursor-pointer ${
          currentVote === "up"
            ? "text-[#00ff88] drop-shadow-[0_0_4px_#00ff8880]"
            : "text-hud-muted hover:text-[#00ff88]"
        }`}
      >
        ▲
      </button>
      <button
        type="button"
        onClick={handleDownvote}
        title="Bury in feed"
        className={`leading-none transition-colors cursor-pointer ${
          currentVote === "down"
            ? "text-[#ff4757] drop-shadow-[0_0_4px_#ff475780]"
            : "text-hud-muted hover:text-[#ff4757]"
        }`}
      >
        ▼
      </button>
    </span>
  );
}
