"use client";

import { useState } from "react";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { IntelCard } from "./IntelCard";
import { ScrollArea } from "@/components/ui/scroll-area";

const TABS = ["INTEL FEED", "ANALYSIS", "AI BRIEF"] as const;

export function IntelFeed() {
  const { items, isLoading, total } = useIntelFeed();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("INTEL FEED");

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-hud-panel to-hud-surface border-l border-hud-border">
      {/* Tabs */}
      <div className="flex border-b border-hud-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-center font-mono text-[9px] tracking-wider transition-colors
              ${
                activeTab === tab
                  ? "text-hud-accent border-b-2 border-hud-accent"
                  : "text-hud-muted hover:text-hud-text"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 flex flex-col gap-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="font-mono text-[10px] text-hud-accent animate-blink">
                ◆ LOADING INTEL STREAM...
              </span>
            </div>
          ) : activeTab === "INTEL FEED" ? (
            items.slice(0, 30).map((item) => (
              <IntelCard key={item.id} item={item} />
            ))
          ) : activeTab === "AI BRIEF" ? (
            <div className="p-4 text-center font-mono text-[10px] text-hud-muted">
              AI Brief panel — connected in Task 21
            </div>
          ) : (
            <div className="p-4 text-center font-mono text-[10px] text-hud-muted">
              Analysis panel — post-MVP
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-hud-border flex justify-between items-center">
        <span className="font-mono text-[8px] text-hud-muted">
          {total} events tracked
        </span>
        <span className="font-mono text-[8px] text-severity-low animate-blink">
          ● STREAMING
        </span>
      </div>
    </div>
  );
}
