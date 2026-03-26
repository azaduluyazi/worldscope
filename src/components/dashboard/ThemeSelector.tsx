"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/components/shared/ThemeProvider";
import { THEME_GROUPS } from "@/config/themes";
import type { DashboardTheme } from "@/config/themes";

/**
 * Theme selector dropdown — 20 dashboard themes organized by category.
 * Uses portal to render outside parent overflow constraints.
 */
export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Calculate position when opening
  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  // Group themes by category
  const grouped = themes.reduce<Record<string, DashboardTheme[]>>((acc, t) => {
    const group = t.group || "tactical";
    if (!acc[group]) acc[group] = [];
    acc[group].push(t);
    return acc;
  }, {});

  const groupOrder = ["tactical", "ambient", "terminal", "broadcast", "modern", "editorial"] as const;

  const dropdown = isOpen ? (
    <div
      ref={panelRef}
      className="fixed z-[9999] bg-hud-panel/95 backdrop-blur-md border border-hud-border rounded-lg shadow-2xl shadow-black/60 w-[280px] max-h-[80vh] overflow-y-auto hud-scrollbar"
      style={{ top: pos.top, right: pos.right }}
    >
      <div className="px-3 py-2 border-b border-hud-border/50 sticky top-0 bg-hud-panel/95 backdrop-blur-md z-10">
        <span className="font-mono text-[8px] text-hud-muted tracking-wider">
          DASHBOARD THEME ({themes.length})
        </span>
      </div>

      {groupOrder.map((groupKey) => {
        const groupThemes = grouped[groupKey];
        if (!groupThemes?.length) return null;
        const label = THEME_GROUPS[groupKey] || groupKey;

        return (
          <div key={groupKey}>
            <div className="px-3 pt-2.5 pb-1">
              <span className="font-mono text-[7px] text-hud-muted/60 tracking-[0.15em] uppercase">
                {label}
              </span>
            </div>

            {groupThemes.map((t) => {
              const isActive = t.id === theme.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 transition-all ${
                    isActive ? "bg-hud-accent/10" : "hover:bg-hud-surface/50"
                  }`}
                >
                  <span className="text-[13px] w-5 text-center shrink-0">{t.icon}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className={`font-mono text-[9px] tracking-wider truncate ${isActive ? "text-hud-accent" : "text-hud-text"}`}>
                      {t.name.toUpperCase()}
                    </div>
                    <div className="font-mono text-[7px] text-hud-muted truncate">{t.description}</div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.accent }} />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.panel, border: `1px solid ${t.colors.border}` }} />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.text, opacity: 0.5 }} />
                  </div>
                  {isActive && <span className="text-hud-accent text-[8px] shrink-0">●</span>}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-hud-surface/50 transition-colors"
        title="Change theme"
      >
        <span className="text-[11px]">{theme.icon}</span>
      </button>
      {typeof window !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
