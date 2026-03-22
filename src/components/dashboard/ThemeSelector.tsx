"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/shared/ThemeProvider";

/**
 * Theme selector dropdown — cycles through 6 dashboard themes.
 * Positioned in TopBar settings area.
 */
export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-hud-surface/50 transition-colors"
        title="Change theme"
      >
        <span className="text-[11px]">{theme.icon}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-[200] bg-hud-panel/95 backdrop-blur-md border border-hud-border rounded-lg shadow-xl shadow-black/50 overflow-hidden min-w-[200px]">
          <div className="px-3 py-2 border-b border-hud-border/50">
            <span className="font-mono text-[8px] text-hud-muted tracking-wider">DASHBOARD THEME</span>
          </div>
          {themes.map((t) => {
            const isActive = t.id === theme.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all ${
                  isActive ? "bg-hud-accent/10" : "hover:bg-hud-surface/50"
                }`}
              >
                <span className="text-[14px]">{t.icon}</span>
                <div className="flex-1 text-left">
                  <div className={`font-mono text-[9px] tracking-wider ${isActive ? "text-hud-accent" : "text-hud-text"}`}>
                    {t.name.toUpperCase()}
                  </div>
                  <div className="font-mono text-[7px] text-hud-muted">{t.description}</div>
                </div>
                {/* Color preview dots */}
                <div className="flex gap-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.accent }} />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.base, border: `1px solid ${t.colors.border}` }} />
                </div>
                {isActive && <span className="text-hud-accent text-[8px]">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
