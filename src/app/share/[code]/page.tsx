"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface WatchlistItem {
  type: "country" | "category" | "region";
  value: string;
  addedAt: string;
}

const TYPE_STYLES: Record<WatchlistItem["type"], { label: string; color: string; bg: string }> = {
  country: { label: "Country", color: "#00e5ff", bg: "rgba(0,229,255,0.1)" },
  category: { label: "Category", color: "#ffd000", bg: "rgba(255,208,0,0.1)" },
  region: { label: "Region", color: "#8a5cf6", bg: "rgba(138,92,246,0.1)" },
};

export default function SharedWatchlistPage() {
  const params = useParams();
  const code = params?.code as string;

  const [items, setItems] = useState<WatchlistItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    if (!code) return;

    fetch(`/api/watchlist/share?code=${encodeURIComponent(code)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "not_found" : "fetch_error");
        return res.json();
      })
      .then((data) => {
        setItems(data.items);
      })
      .catch((err) => {
        setError(err.message === "not_found" ? "not_found" : "error");
      })
      .finally(() => setLoading(false));
  }, [code]);

  function handleImport() {
    if (!items) return;

    const WATCHLIST_KEY = "worldscope_watchlist";
    let existing: WatchlistItem[] = [];
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      existing = raw ? JSON.parse(raw) : [];
    } catch {
      existing = [];
    }

    // Merge with deduplication by type+value
    const existingKeys = new Set(existing.map((i) => `${i.type}:${i.value}`));
    const newItems = items.filter((i) => !existingKeys.has(`${i.type}:${i.value}`));
    const merged = [...existing, ...newItems];
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(merged));
    setImported(true);
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono text-sm">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  // 404 state
  if (error === "not_found") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">&#x1f50d;</div>
          <h1 className="text-xl font-bold text-white font-mono mb-2">Watchlist Not Found</h1>
          <p className="text-gray-400 text-sm mb-6">
            This shared watchlist may have expired or the link is invalid. Shared watchlists expire after 30 days.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded font-mono text-sm hover:bg-cyan-500/30 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-red-400 font-mono mb-2">Error Loading Watchlist</h1>
          <p className="text-gray-400 text-sm">Something went wrong. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!items) return null;

  const grouped: Record<WatchlistItem["type"], WatchlistItem[]> = {
    country: items.filter((i) => i.type === "country"),
    category: items.filter((i) => i.type === "category"),
    region: items.filter((i) => i.type === "region"),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
              WorldScope Shared Watchlist
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white">
            Shared Watchlist
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""} &middot; Code: <code className="text-cyan-400">{code}</code>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Import button */}
        <div className="bg-[#12121a] border border-white/10 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-mono text-white">Import to Your Watchlist</p>
            <p className="text-xs text-gray-500 mt-1">
              Merge these items into your local watchlist (duplicates are skipped)
            </p>
          </div>
          <button
            onClick={handleImport}
            disabled={imported}
            className={`px-5 py-2 rounded font-mono text-sm font-medium transition-all ${
              imported
                ? "bg-green-500/20 border border-green-500/40 text-green-400 cursor-default"
                : "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 active:scale-95"
            }`}
          >
            {imported ? "Imported" : "Import"}
          </button>
        </div>

        {/* Items by type */}
        {(["country", "category", "region"] as const).map((type) => {
          const group = grouped[type];
          if (group.length === 0) return null;
          const style = TYPE_STYLES[type];

          return (
            <div key={type}>
              <h2
                className="text-xs font-mono uppercase tracking-wider mb-3"
                style={{ color: style.color }}
              >
                {style.label}s ({group.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.map((item, idx) => (
                  <div
                    key={`${item.type}-${item.value}-${idx}`}
                    className="px-3 py-2 rounded border text-sm font-mono"
                    style={{
                      borderColor: `${style.color}33`,
                      backgroundColor: style.bg,
                      color: style.color,
                    }}
                  >
                    {item.value}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-cyan-400 transition-colors font-mono"
          >
            Open WorldScope Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
