"use client";

import { useState, useMemo } from "react";
import { useIntelFeed } from "@/hooks/useIntelFeed";

/** Regions for filtering sources by geographic focus */
const SOURCE_REGIONS: Record<string, string[]> = {
  GLOBAL: ["GDELT", "ReliefWeb", "GDACS", "WHO", "USGS", "NASA", "AP", "Reuters", "BBC", "CNN", "Al Jazeera", "France24"],
  US: ["NPR", "NBC", "CBS", "ABC News", "Fox", "Politico", "NY Times", "Washington Post", "Bloomberg", "CNBC", "FBI", "SEC"],
  EUROPE: ["BBC", "DW", "Euronews", "Guardian", "ANSA", "EFE", "Bild", "Le Monde", "Bellingcat", "UK Police"],
  MIDDLE_EAST: ["Al Jazeera", "Al Arabiya", "Asharq", "Al Monitor", "Arab News", "OREF", "i24"],
  ASIA: ["NHK", "SCMP", "Asahi", "Korea Times", "Yonhap", "CNA", "Times of India"],
  AFRICA: ["Africa News", "AllAfrica", "Africanews", "BBC Africa"],
};

interface SourceSelectorProps {
  excludedSources: Set<string>;
  onToggleSource: (source: string) => void;
  onClearFilters: () => void;
}

export function SourceSelector({ excludedSources, onToggleSource, onClearFilters }: SourceSelectorProps) {
  const { items } = useIntelFeed();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState<string>("ALL");

  // Collect all unique sources from current feed
  const allSources = useMemo(() => {
    const sourceMap = new Map<string, number>();
    items.forEach((item) => {
      const count = sourceMap.get(item.source) || 0;
      sourceMap.set(item.source, count + 1);
    });
    return Array.from(sourceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [items]);

  // Filter by region + search
  const filteredSources = useMemo(() => {
    let sources = allSources;

    if (activeRegion !== "ALL") {
      const regionSources = SOURCE_REGIONS[activeRegion] || [];
      sources = sources.filter((s) =>
        regionSources.some((rs) => s.name.toLowerCase().includes(rs.toLowerCase()))
      );
    }

    if (search) {
      const q = search.toLowerCase();
      sources = sources.filter((s) => s.name.toLowerCase().includes(q));
    }

    return sources;
  }, [allSources, activeRegion, search]);

  const activeCount = allSources.length - excludedSources.size;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="font-mono text-[8px] px-2 py-1 rounded border border-hud-border text-hud-muted hover:text-hud-accent hover:border-hud-accent/30 transition-colors flex items-center gap-1"
      >
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        SOURCES {excludedSources.size > 0 && <span className="text-hud-accent">{activeCount}/{allSources.length}</span>}
      </button>
    );
  }

  return (
    <div className="glass-panel rounded-lg p-3 border border-hud-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="hud-label text-[8px]">◆ Source Filter</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[7px] text-hud-accent">
            {activeCount}/{allSources.length} active
          </span>
          <button
            onClick={onClearFilters}
            className="font-mono text-[7px] text-hud-muted hover:text-hud-accent transition-colors"
          >
            RESET
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-hud-muted hover:text-hud-text text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter sources..."
        className="w-full mb-2 px-2 py-1 bg-hud-base border border-hud-border rounded font-mono text-[9px] text-hud-text placeholder-hud-muted/50 focus:border-hud-accent/40 focus:outline-none"
      />

      {/* Region tabs */}
      <div className="flex flex-wrap gap-1 mb-2">
        {["ALL", ...Object.keys(SOURCE_REGIONS)].map((region) => (
          <button
            key={region}
            onClick={() => setActiveRegion(region)}
            className={`font-mono text-[7px] px-1.5 py-0.5 rounded transition-colors ${
              activeRegion === region
                ? "bg-hud-accent/20 text-hud-accent border border-hud-accent/30"
                : "text-hud-muted border border-hud-border hover:border-hud-accent/20"
            }`}
          >
            {region.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Source grid */}
      <div className="max-h-[200px] overflow-y-auto hud-scrollbar space-y-0.5">
        {filteredSources.map((source) => {
          const isExcluded = excludedSources.has(source.name);
          return (
            <button
              key={source.name}
              onClick={() => onToggleSource(source.name)}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors ${
                isExcluded
                  ? "opacity-40 bg-hud-base"
                  : "bg-hud-surface/50 hover:bg-hud-panel/50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-sm border ${
                    isExcluded ? "border-hud-border" : "border-hud-accent bg-hud-accent/30"
                  }`}
                />
                <span className="font-mono text-[8px] text-hud-text truncate max-w-[120px]">
                  {source.name}
                </span>
              </div>
              <span className="font-mono text-[7px] text-hud-muted shrink-0">
                {source.count}
              </span>
            </button>
          );
        })}
        {filteredSources.length === 0 && (
          <p className="text-[8px] text-hud-muted text-center py-4 font-mono">No sources match filter</p>
        )}
      </div>
    </div>
  );
}
