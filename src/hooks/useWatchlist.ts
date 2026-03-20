"use client";

import { useState, useCallback, useEffect } from "react";

const WATCHLIST_KEY = "worldscope_watchlist";

export interface WatchlistItem {
  type: "country" | "category" | "region";
  value: string;
  addedAt: string;
}

function loadWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistWatchlist(items: WatchlistItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
}

/**
 * Cookie-free watchlist using localStorage.
 * Tracks countries, categories, and regions the user wants to monitor.
 * No login required.
 */
export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  // Load on mount
  useEffect(() => {
    setItems(loadWatchlist());
  }, []);

  const isWatched = useCallback(
    (type: WatchlistItem["type"], value: string) =>
      items.some((i) => i.type === type && i.value === value),
    [items]
  );

  const toggle = useCallback(
    (type: WatchlistItem["type"], value: string) => {
      setItems((prev) => {
        const exists = prev.findIndex((i) => i.type === type && i.value === value);
        let next: WatchlistItem[];
        if (exists >= 0) {
          next = prev.filter((_, i) => i !== exists);
        } else {
          next = [...prev, { type, value, addedAt: new Date().toISOString() }];
        }
        persistWatchlist(next);
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => {
    setItems([]);
    persistWatchlist([]);
  }, []);

  const watchedCountries = items.filter((i) => i.type === "country").map((i) => i.value);
  const watchedCategories = items.filter((i) => i.type === "category").map((i) => i.value);
  const watchedRegions = items.filter((i) => i.type === "region").map((i) => i.value);

  return {
    items,
    isWatched,
    toggle,
    clear,
    watchedCountries,
    watchedCategories,
    watchedRegions,
    count: items.length,
  };
}
