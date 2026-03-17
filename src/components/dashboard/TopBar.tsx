"use client";

import { formatUTC } from "@/lib/utils/date";
import { useEffect, useState } from "react";

export function TopBar() {
  const [time, setTime] = useState(formatUTC());

  useEffect(() => {
    const interval = setInterval(() => setTime(formatUTC()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-11 bg-gradient-to-b from-hud-panel to-hud-surface border-b border-hud-border flex items-center px-4 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 border-2 border-hud-accent rounded-full flex items-center justify-center">
          <div
            className="w-3 h-3 rounded-full animate-radar"
            style={{
              background: "conic-gradient(from 0deg, #00e5ff, transparent, #00e5ff)",
            }}
          />
        </div>
        <span className="font-mono text-sm font-bold text-hud-accent tracking-[3px]">
          WORLDSCOPE
        </span>
        <span className="font-mono text-[9px] text-hud-muted ml-1">v1.0</span>
      </div>

      {/* Variant Tabs */}
      <div className="flex-1 flex justify-center gap-1">
        <button className="bg-hud-accent text-hud-base px-4 py-1 rounded-sm font-mono text-[10px] font-bold tracking-wider">
          WORLD
        </button>
        <button className="bg-hud-surface text-hud-muted px-4 py-1 rounded-sm font-mono text-[10px] tracking-wider border border-hud-border hover:border-hud-accent/30 transition-colors">
          TECH
        </button>
        <button className="bg-hud-surface text-hud-muted px-4 py-1 rounded-sm font-mono text-[10px] tracking-wider border border-hud-border hover:border-hud-accent/30 transition-colors">
          FINANCE
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 font-mono text-[9px]">
        <span className="text-severity-low animate-blink">● LIVE</span>
        <span className="text-hud-muted">{time}</span>
        <button className="w-6 h-6 border border-hud-border rounded flex items-center justify-center hover:border-hud-accent/30 transition-colors">
          🔔
        </button>
      </div>
    </header>
  );
}
