"use client";

import { useState, useCallback, useMemo } from "react";

/**
 * WidgetGrid — Customizable dashboard widget system.
 *
 * Users can show/hide widgets and choose from preset layouts.
 * Visibility persists to localStorage. Uses CSS Grid for layout
 * (no external dependency needed for toggle + preset system).
 *
 * Future: drag-and-drop reordering via react-grid-layout or dnd-kit.
 */

export interface WidgetConfig {
  id: string;
  title: string;
  icon: string;
  /** Grid column span (out of 12) */
  colSpan: number;
  /** Grid row span (in units of ~200px) */
  rowSpan: number;
  component: React.ReactNode;
}

interface WidgetGridProps {
  widgets: WidgetConfig[];
  storageKey?: string;
}

function getStoredVisibility(key: string, defaults: string[]): string[] {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(`ws-visible-${key}`);
    return stored ? JSON.parse(stored) : defaults;
  } catch {
    return defaults;
  }
}

function saveVisibility(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`ws-visible-${key}`, JSON.stringify(ids));
  } catch {
    /* pass */
  }
}

export function WidgetGrid({ widgets, storageKey = "default" }: WidgetGridProps) {
  const allIds = useMemo(() => widgets.map((w) => w.id), [widgets]);

  const [visibleIds, setVisibleIds] = useState<string[]>(() =>
    getStoredVisibility(storageKey, allIds)
  );
  const [showPicker, setShowPicker] = useState(false);

  const visibleWidgets = useMemo(
    () => widgets.filter((w) => visibleIds.includes(w.id)),
    [widgets, visibleIds]
  );

  const toggleWidget = useCallback(
    (id: string) => {
      setVisibleIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((v) => v !== id)
          : [...prev, id];
        saveVisibility(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const resetLayout = useCallback(() => {
    localStorage.removeItem(`ws-visible-${storageKey}`);
    setVisibleIds(allIds);
  }, [storageKey, allIds]);

  const applyPreset = useCallback(
    (widgetIds: string[]) => {
      setVisibleIds(widgetIds);
      saveVisibility(storageKey, widgetIds);
      setShowPicker(false);
    },
    [storageKey]
  );

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-hud-border bg-hud-panel/30">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="font-mono text-[9px] px-2 py-1 rounded border border-hud-border text-hud-muted hover:text-hud-accent transition-colors"
        >
          ⚙ WIDGETS ({visibleIds.length}/{widgets.length})
        </button>

        {/* Quick presets */}
        <button
          onClick={() => applyPreset(allIds)}
          className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-hud-border/50 text-hud-muted hover:text-hud-accent"
          title="Show all widgets"
        >
          ALL
        </button>
        <button
          onClick={() =>
            applyPreset(["map", "intel-feed", "threat-index", "ai-brief", "convergence"])
          }
          className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-hud-border/50 text-hud-muted hover:text-hud-accent"
          title="Intelligence analyst layout"
        >
          🕵️ ANALYST
        </button>
        <button
          onClick={() =>
            applyPreset(["map", "market-ticker", "intel-feed", "threat-index"])
          }
          className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-hud-border/50 text-hud-muted hover:text-hud-accent"
          title="Market trader layout"
        >
          📈 TRADER
        </button>
        <button
          onClick={() =>
            applyPreset(["intel-feed", "live-broadcasts", "trending", "map"])
          }
          className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-hud-border/50 text-hud-muted hover:text-hud-accent"
          title="Journalist layout"
        >
          📰 PRESS
        </button>

        <button
          onClick={resetLayout}
          className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-hud-border/50 text-hud-muted hover:text-severity-critical ml-auto"
        >
          ↺ RESET
        </button>
      </div>

      {/* Widget Picker Dropdown */}
      {showPicker && (
        <div className="absolute top-10 left-2 z-50 bg-hud-base border border-hud-border rounded-md p-3 shadow-lg max-w-sm">
          <div className="font-mono text-[9px] text-hud-accent font-bold tracking-wider mb-2">
            TOGGLE WIDGETS
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {widgets.map((w) => (
              <button
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                className={`font-mono text-[8px] px-2 py-1.5 rounded border text-left transition-colors ${
                  visibleIds.includes(w.id)
                    ? "bg-hud-accent/20 border-hud-accent/50 text-hud-accent"
                    : "border-hud-border text-hud-muted hover:border-hud-accent/30"
                }`}
              >
                {w.icon} {w.title}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPicker(false)}
            className="mt-2 w-full font-mono text-[8px] text-hud-muted hover:text-hud-accent"
          >
            Close
          </button>
        </div>
      )}

      {/* CSS Grid Layout */}
      <div className="grid grid-cols-12 gap-1.5 p-1.5 auto-rows-[200px]">
        {visibleWidgets.map((widget) => (
          <div
            key={widget.id}
            className="bg-hud-panel/50 border border-hud-border rounded-md overflow-hidden flex flex-col"
            style={{
              gridColumn: `span ${Math.min(widget.colSpan, 12)}`,
              gridRow: `span ${widget.rowSpan}`,
            }}
          >
            {/* Widget header */}
            <div className="flex items-center gap-1.5 px-2 py-1 border-b border-hud-border/50 flex-shrink-0">
              <span className="text-[10px]">{widget.icon}</span>
              <span className="font-mono text-[8px] text-hud-muted font-bold tracking-wider uppercase">
                {widget.title}
              </span>
            </div>
            {/* Widget content */}
            <div className="flex-1 overflow-auto">{widget.component}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
