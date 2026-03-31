"use client";

import { useState, useCallback } from "react";

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
  const [items, setItems] = useState<WatchlistItem[]>(() => loadWatchlist());

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

  /**
   * Share current watchlist via a short URL code.
   * Posts items to /api/watchlist/share, returns the share URL.
   */
  const shareWatchlist = useCallback(async (): Promise<string | null> => {
    if (items.length === 0) return null;
    try {
      const res = await fetch("/api/watchlist/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url as string;
    } catch {
      return null;
    }
  }, [items]);

  /**
   * Import external watchlist items, merging into local storage.
   * Deduplicates by type+value.
   */
  const importWatchlist = useCallback(
    (newItems: WatchlistItem[]) => {
      setItems((prev) => {
        const existingKeys = new Set(prev.map((i) => `${i.type}:${i.value}`));
        const deduped = newItems.filter((i) => !existingKeys.has(`${i.type}:${i.value}`));
        const merged = [...prev, ...deduped];
        persistWatchlist(merged);
        return merged;
      });
    },
    []
  );

  return {
    items,
    isWatched,
    toggle,
    clear,
    shareWatchlist,
    importWatchlist,
    watchedCountries,
    watchedCategories,
    watchedRegions,
    count: items.length,
  };
}
