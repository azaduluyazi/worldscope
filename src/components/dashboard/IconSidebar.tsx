"use client";

import { useState } from "react";

interface SidebarItem {
  id: string;
  icon: string;
  label: string;
  color: string;
  count?: number;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "map", icon: "🗺", label: "Map", color: "#00e5ff" },
  { id: "news", icon: "📰", label: "News", color: "#00e5ff" },
  { id: "markets", icon: "📊", label: "Markets", color: "#ffd000" },
  { id: "conflict", icon: "⚔️", label: "Conflicts", color: "#ff4757" },
  { id: "tech", icon: "💻", label: "Tech", color: "#8a5cf6" },
  { id: "aviation", icon: "✈️", label: "Aviation", color: "#00ff88" },
  { id: "cyber", icon: "🛡️", label: "Cyber", color: "#00e5ff" },
];

export function IconSidebar() {
  const [active, setActive] = useState("map");

  return (
    <aside className="w-[52px] bg-hud-surface border-r border-hud-border flex flex-col items-center py-2 gap-1 z-50">
      {SIDEBAR_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => setActive(item.id)}
          title={item.label}
          className={`w-9 h-9 rounded-md flex items-center justify-center text-base transition-all relative
            ${
              active === item.id
                ? "bg-hud-accent/10 border border-hud-accent/30"
                : "bg-hud-panel border border-hud-border hover:border-hud-muted"
            }`}
        >
          {item.icon}
          {item.count && (
            <span className="absolute -top-1 -right-1 bg-severity-critical text-[7px] font-mono text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {item.count}
            </span>
          )}
        </button>
      ))}

      <div className="flex-1" />

      <button
        title="Settings"
        className="w-9 h-9 rounded-md bg-hud-panel border border-hud-border flex items-center justify-center text-base hover:border-hud-muted transition-colors"
      >
        ⚙️
      </button>
    </aside>
  );
}
