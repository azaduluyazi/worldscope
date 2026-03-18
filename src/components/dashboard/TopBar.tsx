"use client";

import Link from "next/link";
import { formatUTC } from "@/lib/utils/date";
import { useEffect, useState } from "react";
import { VARIANTS, type VariantId } from "@/config/variants";

const VARIANT_ROUTES: { id: VariantId; label: string; href: string }[] = [
  { id: "world", label: "WORLD", href: "/" },
  { id: "tech", label: "TECH", href: "/tech" },
  { id: "finance", label: "FINANCE", href: "/finance" },
];

interface TopBarProps {
  variant?: VariantId;
}

export function TopBar({ variant = "world" }: TopBarProps) {
  const [time, setTime] = useState(formatUTC());
  const config = VARIANTS[variant];

  useEffect(() => {
    const interval = setInterval(() => setTime(formatUTC()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-11 bg-gradient-to-b from-hud-panel to-hud-surface border-b border-hud-border flex items-center px-4 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 border-2 rounded-full flex items-center justify-center"
          style={{ borderColor: config.accent }}
        >
          <div
            className="w-3 h-3 rounded-full animate-radar"
            style={{
              background: `conic-gradient(from 0deg, ${config.accent}, transparent, ${config.accent})`,
            }}
          />
        </div>
        <span
          className="font-mono text-sm font-bold tracking-[3px]"
          style={{ color: config.accent }}
        >
          {config.name.toUpperCase()}
        </span>
        <span className="font-mono text-[9px] text-hud-muted ml-1">v1.0</span>
      </div>

      {/* Variant Tabs */}
      <div className="flex-1 flex justify-center gap-1">
        {VARIANT_ROUTES.map((route) => {
          const isActive = route.id === variant;
          const routeConfig = VARIANTS[route.id];
          return (
            <Link
              key={route.id}
              href={route.href}
              className={`px-4 py-1 rounded-sm font-mono text-[10px] tracking-wider transition-colors ${
                isActive
                  ? "font-bold"
                  : "bg-hud-surface text-hud-muted border border-hud-border hover:border-hud-accent/30"
              }`}
              style={
                isActive
                  ? { backgroundColor: routeConfig.accent, color: "#050a12" }
                  : undefined
              }
            >
              {route.label}
            </Link>
          );
        })}
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
