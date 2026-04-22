"use client";

import { useMemo, useState } from "react";
import type { OsintCategory, OsintResource } from "@/config/osint-resources";

interface CountryOption {
  code: string;
  name: string;
}

interface Props {
  resources: OsintResource[];
  countries: CountryOption[];
}

const CATEGORY_LABELS: Record<OsintCategory, string> = {
  conflict: "Çatışma",
  cyber: "Siber",
  geospatial: "Coğrafi",
  satellite: "Uydu",
  social: "Sosyal Medya",
  telegram: "Telegram",
  news: "Haber",
  "fact-check": "Doğrulama",
  "domain-ip": "Domain/IP",
  vuln: "Zafiyet",
  weather: "Hava",
  data: "Veri",
  other: "Diğer",
};

const COST_LABELS = {
  free: "Ücretsiz",
  freemium: "Freemium",
  paid: "Ücretli",
} as const;

export function OsintDirectoryClient({ resources, countries }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<OsintCategory | "all">("all");
  const [activeCost, setActiveCost] = useState<"all" | "free" | "freemium" | "paid">("all");
  const [activeCountry, setActiveCountry] = useState<string>("all");
  const [activeType, setActiveType] = useState<"all" | "feed" | "link">("all");

  const categoryCounts = useMemo(() => {
    const m = new Map<OsintCategory | "all", number>();
    m.set("all", resources.length);
    for (const r of resources) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return m;
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources
      .filter((r) => {
        if (activeCategory !== "all" && r.category !== activeCategory) return false;
        if (activeCost !== "all" && r.cost !== activeCost) return false;
        if (activeType !== "all" && r.integrationType !== activeType) return false;
        if (activeCountry !== "all") {
          if (activeCountry === "GLOBAL" && r.scope !== "GLOBAL") return false;
          if (activeCountry !== "GLOBAL" && r.countryCode !== activeCountry) return false;
        }
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.descriptionTr?.toLowerCase().includes(q) ?? false) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.priority - a.priority);
  }, [resources, query, activeCategory, activeCost, activeCountry, activeType]);

  const categoryKeys: (OsintCategory | "all")[] = [
    "all",
    ...(Object.keys(CATEGORY_LABELS) as OsintCategory[]),
  ];

  return (
    <div>
      {/* Search + top-line filters */}
      <div className="mb-6 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İsim, açıklama veya etiket ara…"
          className="w-full bg-transparent border border-hud-border rounded-sm px-3 py-2 text-sm font-mono text-hud-text placeholder-hud-muted focus:border-hud-accent focus:outline-none"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={activeCost}
            onChange={(e) => setActiveCost(e.target.value as typeof activeCost)}
            className="bg-transparent border border-hud-border rounded-sm px-2 py-1 text-xs font-mono text-hud-text"
          >
            <option value="all">Tüm maliyetler</option>
            <option value="free">Ücretsiz</option>
            <option value="freemium">Freemium</option>
            <option value="paid">Ücretli</option>
          </select>

          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value as typeof activeType)}
            className="bg-transparent border border-hud-border rounded-sm px-2 py-1 text-xs font-mono text-hud-text"
          >
            <option value="all">Tüm tipler</option>
            <option value="feed">Feed (ingest ediliyor)</option>
            <option value="link">Dış bağlantı</option>
          </select>

          <select
            value={activeCountry}
            onChange={(e) => setActiveCountry(e.target.value)}
            className="bg-transparent border border-hud-border rounded-sm px-2 py-1 text-xs font-mono text-hud-text"
          >
            <option value="all">Tüm ülkeler</option>
            <option value="GLOBAL">GLOBAL yalnızca</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {categoryKeys.map((cat) => {
            const label = cat === "all" ? "Hepsi" : CATEGORY_LABELS[cat];
            const count = categoryCounts.get(cat) ?? 0;
            if (count === 0 && cat !== "all") return null;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={[
                  "px-2.5 py-1 text-[11px] font-bold tracking-wider border rounded-sm transition-colors uppercase",
                  active
                    ? "border-hud-accent bg-hud-accent/10 text-hud-accent"
                    : "border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-text/40",
                ].join(" ")}
              >
                {label} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="text-[11px] text-hud-muted mb-3 font-mono">
        {filtered.length} / {resources.length} kaynak gösteriliyor
      </div>

      {filtered.length === 0 ? (
        <div className="border border-hud-border rounded-sm p-8 text-center text-sm text-hud-muted">
          Filtreye uyan kaynak yok. Filtreleri sıfırlamayı deneyin.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <ResourceCard key={r.slug} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource: r }: { resource: OsintResource }) {
  const costColor =
    r.cost === "free"
      ? "text-green-400 border-green-400/40"
      : r.cost === "freemium"
        ? "text-cyan-400 border-cyan-400/40"
        : "text-amber-400 border-amber-400/40";

  const typeLabel =
    r.integrationType === "feed"
      ? "◉ FEED"
      : r.integrationType === "widget"
        ? "▣ WIDGET"
        : "↗ LINK";

  return (
    <a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-hud-border hover:border-hud-accent/60 rounded-sm p-4 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-bold text-hud-text group-hover:text-hud-accent transition-colors truncate">
          {r.name}
        </div>
        <span
          className={`shrink-0 text-[9px] px-1.5 py-0.5 border rounded-sm font-mono ${costColor}`}
        >
          {COST_LABELS[r.cost]}
        </span>
      </div>

      <p className="text-xs text-hud-muted leading-relaxed mb-3 line-clamp-3 min-h-[3em]">
        {r.descriptionTr ?? r.description}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-hud-muted">
        <span className="text-hud-accent font-bold tracking-wider">{typeLabel}</span>
        <span className="opacity-40">·</span>
        <span className="uppercase">{r.category}</span>
        {r.countryCode && (
          <>
            <span className="opacity-40">·</span>
            <span className="uppercase">{r.countryCode}</span>
          </>
        )}
        {r.scope === "GLOBAL" && (
          <>
            <span className="opacity-40">·</span>
            <span>GLOBAL</span>
          </>
        )}
      </div>
    </a>
  );
}
