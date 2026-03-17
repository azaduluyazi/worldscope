"use client";

import { useCompletion } from "@ai-sdk/react";
import { useState } from "react";

export function AIBrief() {
  const [hasRequested, setHasRequested] = useState(false);

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/ai/brief",
  });

  const handleGenerate = () => {
    setHasRequested(true);
    complete("");
  };

  return (
    <div className="p-3 flex flex-col gap-3 h-full">
      <div className="flex justify-between items-center">
        <div className="hud-label text-[8px]">◆ AI Strategic Brief</div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="font-mono text-[8px] text-hud-accent border border-hud-accent/30 rounded px-2 py-0.5 hover:bg-hud-accent/10 transition-colors disabled:opacity-50"
        >
          {isLoading ? "ANALYZING..." : "GENERATE"}
        </button>
      </div>

      {!hasRequested ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-[10px] text-hud-muted text-center">
            Click GENERATE for an AI-powered<br />strategic intelligence briefing
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="font-mono text-[10px] text-hud-text leading-relaxed whitespace-pre-wrap">
            {isLoading && !completion && (
              <span className="text-hud-accent animate-blink">
                ◆ ANALYZING INTELLIGENCE STREAM...
              </span>
            )}
            {completion}
          </div>
        </div>
      )}
    </div>
  );
}
