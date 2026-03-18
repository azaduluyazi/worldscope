"use client";

import { useState, useEffect } from "react";

const SHORTCUTS = [
  { key: "1-9", desc: "Toggle category filters" },
  { key: "H", desc: "Toggle heatmap" },
  { key: "C", desc: "Toggle clusters" },
  { key: "Esc", desc: "Clear all filters" },
  { key: "/", desc: "Open search" },
  { key: "←→", desc: "Navigate countries" },
  { key: "?", desc: "Toggle this help" },
];

export function KeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div className="bg-hud-surface border border-hud-border rounded-lg p-5 w-72 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="font-mono text-[11px] font-bold text-hud-accent tracking-wider mb-4">
          ⌨ KEYBOARD SHORTCUTS
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <kbd className="font-mono text-[9px] bg-hud-panel border border-hud-border rounded px-2 py-0.5 text-hud-accent min-w-[40px] text-center">
                {s.key}
              </kbd>
              <span className="font-mono text-[9px] text-hud-muted">{s.desc}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-hud-border text-center">
          <span className="font-mono text-[7px] text-hud-muted">Press ? to close</span>
        </div>
      </div>
    </div>
  );
}
