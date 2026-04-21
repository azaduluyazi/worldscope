"use client";

import { useEffect, useMemo, useState } from "react";
import { COUNTRIES } from "@/config/countries";

interface Preferences {
  country_codes: string[];
  daily_enabled: boolean;
  weekly_enabled: boolean;
  locale: "en" | "tr";
  last_daily_sent_at: string | null;
  last_weekly_sent_at: string | null;
}

const MAX_COUNTRIES = 15;

interface Props {
  /** True when the user landed via ?welcome=1 and has no prefs yet. */
  openByDefault?: boolean;
  /** Signed-in user is on Gaia — otherwise we show a lock-in upsell next
   *  to the Save button explaining emails only start after subscribing. */
  isPaid?: boolean;
}

/**
 * Briefing Preferences card — the core Gaia value-prop controller.
 *
 * Lets the subscriber pick up to 5 ISO-3166 countries and toggle daily /
 * weekly delivery. Autosaves via PUT /api/me/preferences.
 *
 * Design note — intentionally rendered as a type-ahead search + chip list
 * rather than a full country grid. With 195 countries, a grid is
 * paralysis-inducing; a search-and-pin flow lets the user add Türkiye,
 * ABD, İran in 10 seconds.
 */
export function BriefingPreferencesCard({ openByDefault = false, isPaid = false }: Props) {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Hydrate once
  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/preferences", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Preferences) => {
        if (!cancelled) {
          setPrefs(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load preferences");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return COUNTRIES.filter(
      (c) =>
        !prefs?.country_codes.includes(c.code) &&
        (c.name.toLowerCase().includes(q) ||
          c.nameTr.toLowerCase().includes(q) ||
          c.code.toLowerCase() === q),
    ).slice(0, 6);
  }, [search, prefs]);

  async function save(next: Preferences) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/me/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          country_codes: next.country_codes,
          daily_enabled: next.daily_enabled,
          weekly_enabled: next.weekly_enabled,
          locale: next.locale,
        }),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "save failed");
    } finally {
      setSaving(false);
    }
  }

  function addCountry(code: string) {
    if (!prefs) return;
    if (prefs.country_codes.length >= MAX_COUNTRIES) return;
    if (prefs.country_codes.includes(code)) return;
    const next = { ...prefs, country_codes: [...prefs.country_codes, code] };
    setPrefs(next);
    setSearch("");
    void save(next);
  }

  function removeCountry(code: string) {
    if (!prefs) return;
    const next = {
      ...prefs,
      country_codes: prefs.country_codes.filter((c) => c !== code),
    };
    setPrefs(next);
    void save(next);
  }

  function toggle(key: "daily_enabled" | "weekly_enabled") {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    void save(next);
  }

  if (loading || !prefs) {
    return (
      <div
        id="briefing-preferences"
        className="border border-gray-800 rounded-sm p-4 bg-[#0a0810] mb-6 scroll-mt-24"
      >
        <h2 className="text-sm font-bold text-amber-400 mb-3 tracking-wide uppercase">
          Briefing Preferences
        </h2>
        <p className="text-xs text-gray-500">Loading…</p>
      </div>
    );
  }

  const countByCode = new Map(COUNTRIES.map((c) => [c.code, c]));
  const emptyState = prefs.country_codes.length === 0;

  return (
    <div
      id="briefing-preferences"
      className={`border rounded-sm p-5 mb-6 scroll-mt-24 ${
        emptyState && openByDefault
          ? "border-amber-400/60 bg-amber-400/5"
          : "border-gray-800 bg-[#0a0810]"
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h2 className="text-sm font-bold text-amber-400 tracking-wide uppercase">
          Briefing Preferences
        </h2>
        <span className="font-mono text-[10px] text-gray-500">
          {prefs.country_codes.length}/{MAX_COUNTRIES} countries
        </span>
      </div>

      {emptyState && openByDefault && (
        <p className="text-xs text-amber-200/80 mb-4">
          Welcome aboard. Pick 1–5 countries to tailor your daily intelligence
          briefing — you can change these any time.
        </p>
      )}
      {!emptyState && !isPaid && (
        <p className="text-[11px] text-amber-200/80 mb-3">
          Emails start once your Gaia subscription is active.
        </p>
      )}

      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 mb-4 min-h-[32px] items-start">
        {prefs.country_codes.map((code) => {
          const c = countByCode.get(code);
          if (!c) return null;
          return (
            <button
              key={code}
              type="button"
              onClick={() => removeCountry(code)}
              className="group inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[11px] text-amber-200 bg-amber-400/15 border border-amber-400/40 rounded-sm hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-200 transition-colors"
              aria-label={`Remove ${c.name}`}
            >
              <span>{c.name}</span>
              <span className="opacity-60 group-hover:opacity-100">×</span>
            </button>
          );
        })}
        {prefs.country_codes.length === 0 && (
          <span className="font-mono text-[11px] text-gray-500">
            No countries yet. Search below to add up to {MAX_COUNTRIES}.
          </span>
        )}
      </div>

      {/* Search + add */}
      {prefs.country_codes.length < MAX_COUNTRIES && (
        <div className="relative mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries (e.g. Türkiye, Iran, US)"
            className="w-full px-3 py-2 bg-[#060509] border border-gray-800 rounded-sm font-mono text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50 transition-colors"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-[#0a0810] border border-gray-800 rounded-sm shadow-lg max-h-52 overflow-auto">
              {searchResults.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => addCountry(c.code)}
                  className="w-full text-left px-3 py-1.5 font-mono text-xs text-gray-200 hover:bg-amber-400/10 hover:text-amber-300 transition-colors flex justify-between"
                >
                  <span>
                    {c.name} <span className="text-gray-600">/ {c.nameTr}</span>
                  </span>
                  <span className="text-gray-600">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Frequency toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <FrequencyRow
          label="Daily briefing"
          description="Delivered at 07:00 UTC"
          enabled={prefs.daily_enabled}
          onToggle={() => toggle("daily_enabled")}
          lastSent={prefs.last_daily_sent_at}
        />
        <FrequencyRow
          label="Weekly rollup"
          description="Delivered Monday 08:00 UTC"
          enabled={prefs.weekly_enabled}
          onToggle={() => toggle("weekly_enabled")}
          lastSent={prefs.last_weekly_sent_at}
        />
      </div>

      {/* Save state + error — fixed height so toggling daily/weekly
          doesn't cause layout shift as the status text appears/hides. */}
      <div className="flex items-center justify-between text-[10px] font-mono h-[14px] leading-[14px]">
        <span className="text-gray-500">
          {saving ? "Saving…" : saved ? "Saved ✓" : "\u00a0"}
        </span>
        {error && <span className="text-red-400">{error}</span>}
      </div>
    </div>
  );
}

interface FrequencyRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  lastSent: string | null;
}

function FrequencyRow({ label, description, enabled, onToggle, lastSent }: FrequencyRowProps) {
  return (
    <div
      className={`border rounded-sm p-3 transition-colors ${
        enabled
          ? "border-amber-400/50 bg-amber-400/5"
          : "border-gray-800 bg-[#060509]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-gray-200 font-bold">{label}</div>
          <div className="font-mono text-[10px] text-gray-500 mt-0.5">
            {description}
          </div>
          {lastSent && (
            <div className="font-mono text-[10px] text-gray-600 mt-1">
              Last sent {new Date(lastSent).toISOString().slice(0, 10)}
            </div>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          className={`relative w-10 h-5 rounded-full border transition-colors shrink-0 ${
            enabled
              ? "bg-amber-400 border-amber-400"
              : "bg-gray-800 border-gray-700"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-[#060509] rounded-full transition-transform ${
              enabled ? "translate-x-[22px]" : "translate-x-[2px]"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
