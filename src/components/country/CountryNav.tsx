"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { COUNTRIES, REGIONS } from "@/config/countries";
import { getFlagEmoji, getNeighborCountries } from "@/lib/utils/country-helpers";

interface CountryNavProps {
  currentCode: string;
}

export function CountryNav({ currentCode }: CountryNavProps) {
  const t = useTranslations("country");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { prev, next } = useMemo(
    () => getNeighborCountries(currentCode),
    [currentCode]
  );

  // Keyboard navigation: left/right arrow for prev/next country
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        router.push(`/country/${prev.code.toLowerCase()}`);
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        router.push(`/country/${next.code.toLowerCase()}`);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, router]);

  const filteredCountries = useMemo(() => {
    let list = COUNTRIES;
    if (activeRegion) {
      list = list.filter((c) => c.region === activeRegion);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameTr.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeRegion, search]);

  return (
    <div className="space-y-3">
      {/* Prev / Next Navigation */}
      <div className="flex items-center justify-between gap-2">
        {prev ? (
          <Link
            href={`/country/${prev.code.toLowerCase()}`}
            className="flex items-center gap-1.5 bg-hud-surface border border-hud-border rounded-md px-3 py-2 hover:border-hud-muted transition-colors flex-1"
            title={`${t("prevCountry")} (←)`}
          >
            <span className="font-mono text-[10px] text-hud-muted">←</span>
            <span className="text-sm">{getFlagEmoji(prev.code)}</span>
            <span className="font-mono text-[9px] text-hud-text truncate">{prev.name}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        <Link
          href="/"
          className="font-mono text-[8px] text-hud-accent hover:underline px-2 shrink-0"
          title={t("backToDashboard")}
        >
          ◆ GLOBE
        </Link>

        {next ? (
          <Link
            href={`/country/${next.code.toLowerCase()}`}
            className="flex items-center gap-1.5 bg-hud-surface border border-hud-border rounded-md px-3 py-2 hover:border-hud-muted transition-colors flex-1 justify-end"
            title={`${t("nextCountry")} (→)`}
          >
            <span className="font-mono text-[9px] text-hud-text truncate">{next.name}</span>
            <span className="text-sm">{getFlagEmoji(next.code)}</span>
            <span className="font-mono text-[10px] text-hud-muted">→</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full font-mono text-[9px] text-hud-accent tracking-wider hover:underline text-center py-1"
      >
        {isExpanded ? `▲ ${t("collapse")}` : `▼ ${t("allCountries")} (${COUNTRIES.length})`}
      </button>

      {isExpanded && (
        <div className="space-y-3">
          {/* Search */}
          <input
            type="text"
            placeholder={t("searchCountry")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-hud-panel border border-hud-border rounded-md px-3 py-1.5 font-mono text-[10px] text-hud-text placeholder:text-hud-muted focus:outline-none focus:border-hud-accent"
          />

          {/* Region tabs */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveRegion(null)}
              className={`font-mono text-[8px] px-2 py-0.5 rounded border transition-all ${
                !activeRegion
                  ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent"
                  : "bg-hud-panel border-hud-border text-hud-muted hover:text-hud-text"
              }`}
            >
              {t("regionAll")}
            </button>
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setActiveRegion(region === activeRegion ? null : region)}
                className={`font-mono text-[8px] px-2 py-0.5 rounded border transition-all ${
                  activeRegion === region
                    ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent"
                    : "bg-hud-panel border-hud-border text-hud-muted hover:text-hud-text"
                }`}
              >
                {region.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Country grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {filteredCountries.map((c) => (
              <Link
                key={c.code}
                href={`/country/${c.code.toLowerCase()}`}
                className={`font-mono text-[9px] px-2 py-1.5 rounded border transition-all ${
                  c.code === currentCode.toUpperCase()
                    ? "bg-hud-accent/10 border-hud-accent/30 text-hud-accent"
                    : "bg-hud-surface border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-muted"
                }`}
              >
                {getFlagEmoji(c.code)} {c.name}
              </Link>
            ))}
          </div>

          {filteredCountries.length === 0 && (
            <p className="text-center font-mono text-[9px] text-hud-muted py-4">
              {t("noMatch", { query: search })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
