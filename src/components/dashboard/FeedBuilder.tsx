"use client";

import { useState, useMemo, useCallback } from "react";

const CATEGORIES = [
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health", "sports",
] as const;

const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
  info: "#8a5cf6",
};

const BASE_URL = "https://troiamedia.com/api/feeds/custom";

export function FeedBuilder() {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSeverities, setSelectedSeverities] = useState<Set<string>>(new Set());
  const [country, setCountry] = useState("");
  const [limit, setLimit] = useState(50);
  const [copied, setCopied] = useState(false);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleSeverity = useCallback((sev: string) => {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }, []);

  const feedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategories.size > 0) {
      params.set("categories", [...selectedCategories].join(","));
    }
    if (selectedSeverities.size > 0) {
      params.set("severity", [...selectedSeverities].join(","));
    }
    if (country.trim()) {
      params.set("country", country.trim().toUpperCase());
    }
    if (limit !== 50) {
      params.set("limit", String(limit));
    }
    const qs = params.toString();
    return qs ? `${BASE_URL}?${qs}` : BASE_URL;
  }, [selectedCategories, selectedSeverities, country, limit]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const input = document.createElement("input");
      input.value = feedUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [feedUrl]);

  const handleTest = useCallback(() => {
    window.open(feedUrl, "_blank", "noopener,noreferrer");
  }, [feedUrl]);

  return (
    <div className="rounded-lg bg-black/40 border border-white/10 p-4 backdrop-blur-sm">
      {/* Header */}
      <h3 className="text-sm font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-4">
        Custom RSS Feed Builder
      </h3>

      {/* Categories */}
      <div className="mb-4">
        <label className="block text-xs font-mono text-white/50 uppercase mb-2">
          Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all duration-150 border ${
                  active
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity */}
      <div className="mb-4">
        <label className="block text-xs font-mono text-white/50 uppercase mb-2">
          Severity
        </label>
        <div className="flex flex-wrap gap-2">
          {SEVERITIES.map((sev) => {
            const active = selectedSeverities.has(sev);
            const color = SEVERITY_COLORS[sev];
            return (
              <button
                key={sev}
                type="button"
                onClick={() => toggleSeverity(sev)}
                className="px-2.5 py-1 rounded text-xs font-mono transition-all duration-150 border"
                style={{
                  backgroundColor: active ? `${color}20` : "rgba(255,255,255,0.03)",
                  borderColor: active ? `${color}80` : "rgba(255,255,255,0.1)",
                  color: active ? color : "rgba(255,255,255,0.4)",
                }}
              >
                {sev}
              </button>
            );
          })}
        </div>
      </div>

      {/* Country */}
      <div className="mb-4">
        <label className="block text-xs font-mono text-white/50 uppercase mb-2">
          Country (ISO code)
        </label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value.slice(0, 3))}
          placeholder="e.g. US, TR, GB"
          maxLength={3}
          className="w-32 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white/90 text-xs font-mono placeholder-white/20 focus:border-cyan-500/50 focus:outline-none transition-colors"
        />
      </div>

      {/* Limit */}
      <div className="mb-5">
        <label className="block text-xs font-mono text-white/50 uppercase mb-2">
          Limit: {limit}
        </label>
        <input
          type="range"
          min={10}
          max={100}
          step={10}
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value, 10))}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-[10px] text-white/30 font-mono mt-1">
          <span>10</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* URL Preview */}
      <div className="mb-4">
        <label className="block text-xs font-mono text-white/50 uppercase mb-2">
          Feed URL
        </label>
        <div className="bg-black/60 rounded border border-white/10 p-2.5 text-[11px] font-mono text-cyan-300/80 break-all select-all leading-relaxed">
          {feedUrl}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 px-3 py-2 rounded text-xs font-mono font-semibold transition-all duration-200 border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
        >
          {copied ? "Copied!" : "Copy URL"}
        </button>
        <button
          type="button"
          onClick={handleTest}
          className="flex-1 px-3 py-2 rounded text-xs font-mono font-semibold transition-all duration-200 border border-white/20 bg-white/5 text-white/60 hover:text-white/90 hover:bg-white/10"
        >
          Test Feed
        </button>
      </div>
    </div>
  );
}
