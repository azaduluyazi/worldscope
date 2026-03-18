"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { CountryMeta } from "@/config/countries";
import { useCountryEvents } from "@/hooks/useCountryEvents";
import { CountryNav } from "./CountryNav";
import { CountryStats } from "./CountryStats";
import { CountryTimeline } from "./CountryTimeline";
import { CountryFilters } from "./CountryFilters";
import { CountryEventList } from "./CountryEventList";
import { getFlagEmoji } from "@/lib/utils/country-helpers";
import { AdSenseUnit, CarbonAd, AffiliateBanner, AdConsentBanner } from "@/components/ads";
import Link from "next/link";

/** Lazy-load Mapbox mini-map — heavy dependency */
const CountryMiniMap = dynamic(
  () => import("./CountryMiniMap").then((m) => ({ default: m.CountryMiniMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-hud-panel border border-hud-border rounded-lg flex items-center justify-center">
        <span className="font-mono text-[9px] text-hud-muted animate-pulse">◆ LOADING MAP...</span>
      </div>
    ),
  }
);

interface CountryDashboardProps {
  country: CountryMeta;
}

export function CountryDashboard({ country }: CountryDashboardProps) {
  const t = useTranslations("country");
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [severities, setSeverities] = useState<Set<string>>(new Set());

  const { items, allItems, isLoading } = useCountryEvents({
    countryCode: country.code,
    categories,
    severities,
  });

  const toggleCategory = useCallback((cat: string) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleSeverity = useCallback((sev: string) => {
    setSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setCategories(new Set());
    setSeverities(new Set());
  }, []);

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      {/* Header */}
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-[9px] font-mono text-hud-muted mb-3">
            <Link href="/" className="text-hud-accent hover:underline">WORLDSCOPE</Link>
            <span>/</span>
            <span>{country.region.toUpperCase()}</span>
            <span>/</span>
            <span className="text-hud-text">{country.code}</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-4xl">{getFlagEmoji(country.code)}</div>
            <div className="flex-1">
              <h1 className="font-mono text-xl font-bold text-hud-text tracking-wide">
                {country.name}
              </h1>
              <p className="font-mono text-[10px] text-hud-muted mt-0.5">
                {country.nameTr} • {country.region} • {t("events72h", { count: allItems.length })}
              </p>
            </div>
            {isLoading && (
              <span className="font-mono text-[9px] text-hud-accent animate-pulse">◆ SYNCING...</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation (prev/next + country grid) */}
        <CountryNav currentCode={country.code} />

        {/* Top ad */}
        <div className="mt-4 mb-2">
          <AdSenseUnit slot="1234567890" format="horizontal" />
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ── Left Column: Map + Filters + Stats ── */}
          <div className="lg:col-span-4 space-y-4">
            {/* Mini Map */}
            <div className="h-[280px] lg:h-[320px]">
              <CountryMiniMap country={country} items={allItems} />
            </div>

            {/* Filters */}
            <CountryFilters
              activeCategories={categories}
              activeSeverities={severities}
              onToggleCategory={toggleCategory}
              onToggleSeverity={toggleSeverity}
              onClear={clearFilters}
            />

            {/* Stats */}
            <CountryStats allItems={allItems} />

            {/* Sidebar ad */}
            <CarbonAd />
          </div>

          {/* ── Right Column: Timeline + Events ── */}
          <div className="lg:col-span-8 space-y-4">
            {/* Timeline */}
            <CountryTimeline items={allItems} />

            {/* Event List */}
            <CountryEventList items={items} />
          </div>
        </div>

        {/* Bottom affiliate banner */}
        <div className="mt-8">
          <AffiliateBanner />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hud-border bg-hud-surface mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="font-mono text-[8px] text-hud-muted">
            WorldScope — Global Intelligence Dashboard
          </p>
          <Link href="/" className="font-mono text-[9px] text-hud-accent hover:underline mt-1 inline-block">
            ← {t("backToDashboard")}
          </Link>
        </div>
      </footer>

      {/* GDPR Consent Banner */}
      <AdConsentBanner />
    </div>
  );
}
