"use client";

import { useEffect, useCallback } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

/**
 * Global keyboard shortcuts hook for the dashboard.
 *
 * Shortcuts:
 * - 1-5: Toggle category filters (conflict, natural, cyber, finance, tech)
 * - H: Toggle heatmap
 * - C: Toggle clusters
 * - Escape: Clear all filters
 * - /: Focus search (if exists)
 * - ?: Show shortcuts help
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const action = shortcuts[key];
      if (action) {
        e.preventDefault();
        action();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}

/** Category keys mapped to number keys */
export const CATEGORY_KEYS: Record<string, string> = {
  "1": "conflict",
  "2": "natural",
  "3": "cyber",
  "4": "finance",
  "5": "tech",
  "6": "health",
  "7": "energy",
  "8": "diplomacy",
  "9": "protest",
};
