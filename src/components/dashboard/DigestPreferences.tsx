"use client";

import { useState } from "react";

interface DigestPreferences {
  categories: string[];
  minSeverity: string;
  maxItems: number;
}

const CATEGORIES = [
  { id: "conflict", label: "Conflict", icon: "shield" },
  { id: "finance", label: "Finance", icon: "chart" },
  { id: "cyber", label: "Cyber", icon: "lock" },
  { id: "tech", label: "Tech", icon: "cpu" },
  { id: "natural", label: "Weather", icon: "cloud" },
  { id: "aviation", label: "Aviation", icon: "plane" },
  { id: "energy", label: "Energy", icon: "zap" },
  { id: "diplomacy", label: "Diplomacy", icon: "flag" },
  { id: "health", label: "Health", icon: "heart" },
  { id: "sports", label: "Sports", icon: "trophy" },
] as const;

const SEVERITIES = [
  { value: "all", label: "All severities" },
  { value: "medium", label: "Medium and above" },
  { value: "high", label: "High and above" },
  { value: "critical", label: "Critical only" },
];

export default function DigestPreferences() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [categories, setCategories] = useState<string[]>(CATEGORIES.map((c) => c.id));
  const [minSeverity, setMinSeverity] = useState("all");
  const [maxItems, setMaxItems] = useState(50);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(false);

  // Load preferences when email is entered
  async function loadPreferences(emailAddr: string) {
    if (!emailAddr) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/digest/preferences?email=${encodeURIComponent(emailAddr)}`);
      if (res.ok) {
        const data = await res.json();
        setIsSubscribed(true);
        setCategories(data.preferences.categories);
        setMinSeverity(data.preferences.minSeverity);
        setMaxItems(data.preferences.maxItems);
      } else if (res.status === 404) {
        setIsSubscribed(false);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
    setStatus("idle");
  }

  function toggleAll() {
    if (categories.length === CATEGORIES.length) {
      setCategories([]);
    } else {
      setCategories(CATEGORIES.map((c) => c.id));
    }
    setStatus("idle");
  }

  async function handleSave() {
    if (!email || categories.length === 0) return;
    setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/digest/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          preferences: { categories, minSeverity, maxItems },
        }),
      });

      if (res.ok) {
        setStatus("saved");
        setIsSubscribed(true);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#12121a] border border-white/10 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">
          Email Digest Preferences
        </h3>
      </div>

      {/* Email input */}
      <div>
        <label className="block text-xs text-gray-500 font-mono mb-1">Subscriber Email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus("idle");
            }}
            placeholder="your@email.com"
            className="flex-1 bg-[#0a0a0f] border border-white/10 rounded px-3 py-1.5 text-sm font-mono text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
          />
          <button
            onClick={() => loadPreferences(email)}
            disabled={!email || loading}
            className="px-3 py-1.5 text-xs font-mono bg-white/5 border border-white/10 rounded text-gray-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
          >
            {loading ? "..." : "Load"}
          </button>
        </div>
        {!isSubscribed && email && !loading && (
          <p className="text-xs text-yellow-500/70 mt-1 font-mono">
            Not subscribed yet. Subscribe first, then customize.
          </p>
        )}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500 font-mono">Categories</label>
          <button
            onClick={toggleAll}
            className="text-[10px] font-mono text-cyan-400/60 hover:text-cyan-400 transition-colors"
          >
            {categories.length === CATEGORIES.length ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = categories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-mono transition-all border ${
                  isSelected
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-white/[0.02] border-white/5 text-gray-600 hover:text-gray-400 hover:border-white/10"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-sm border transition-all ${
                    isSelected
                      ? "bg-cyan-400 border-cyan-400"
                      : "border-gray-600"
                  }`}
                />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-xs text-gray-500 font-mono mb-1">
          Minimum Severity
        </label>
        <select
          value={minSeverity}
          onChange={(e) => {
            setMinSeverity(e.target.value);
            setStatus("idle");
          }}
          className="w-full bg-[#0a0a0f] border border-white/10 rounded px-3 py-1.5 text-sm font-mono text-white focus:border-cyan-500/50 focus:outline-none appearance-none cursor-pointer"
        >
          {SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Max items slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500 font-mono">Max Items per Digest</label>
          <span className="text-xs font-mono text-cyan-400">{maxItems}</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={maxItems}
          onChange={(e) => {
            setMaxItems(Number(e.target.value));
            setStatus("idle");
          }}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-0.5">
          <span>10</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!email || !isSubscribed || categories.length === 0 || saving}
        className={`w-full py-2 rounded font-mono text-sm font-medium transition-all ${
          status === "saved"
            ? "bg-green-500/20 border border-green-500/40 text-green-400"
            : status === "error"
              ? "bg-red-500/20 border border-red-500/40 text-red-400"
              : "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
        }`}
      >
        {saving
          ? "Saving..."
          : status === "saved"
            ? "Preferences Saved"
            : status === "error"
              ? "Save Failed - Try Again"
              : "Save Preferences"}
      </button>
    </div>
  );
}
