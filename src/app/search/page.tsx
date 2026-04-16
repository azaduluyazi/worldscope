"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useLocale } from "next-intl";
import Link from "next/link";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelFeedResponse, IntelItem } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";
import { AdvancedFilters, type AdvancedFilterValues } from "@/components/search/AdvancedFilters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SearchResults() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const query = searchParams.get("q") || "";

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterValues | null>(null);
  const [semantic, setSemantic] = useState(false);

  // Build API URL with advanced filter params
  const apiUrl = useMemo(() => {
    if (query.length < 2) return null;
    const params = new URLSearchParams();
    params.set("q", query);

    if (semantic) {
      // Semantic endpoint ignores keyword-style filters (dates/category/country
      // etc.) — it ranks purely by vector similarity. Keep the URL minimal.
      params.set("limit", "50");
      return `/api/search/semantic?${params.toString()}`;
    }

    params.set("lang", locale);
    params.set("limit", "500");
    if (advancedFilters) {
      if (advancedFilters.dateFrom) params.set("dateFrom", advancedFilters.dateFrom);
      if (advancedFilters.dateTo) params.set("dateTo", advancedFilters.dateTo);
      if (advancedFilters.severities.size > 0) {
        params.set("severity", Array.from(advancedFilters.severities).join(","));
      }
      if (advancedFilters.category) params.set("category", advancedFilters.category);
      if (advancedFilters.country) params.set("country", advancedFilters.country);
    }
    return `/api/intel?${params.toString()}`;
  }, [query, locale, advancedFilters, semantic]);

  // Response shape differs: /api/intel → {items}; /api/search/semantic → {results}
  const { data, isLoading } = useSWR<IntelFeedResponse & { results?: IntelItem[] }>(apiUrl, fetcher);

  // Apply exact phrase filtering client-side if toggled (keyword mode only)
  const items = useMemo(() => {
    const raw = semantic ? data?.results || [] : data?.items || [];
    if (semantic || !advancedFilters?.exactPhrase || query.length < 2) return raw;
    const phrase = query.toLowerCase();
    return raw.filter(
      (item) =>
        item.title.toLowerCase().includes(phrase) ||
        (item.summary && item.summary.toLowerCase().includes(phrase))
    );
  }, [data, advancedFilters?.exactPhrase, query, semantic]);

  const handleFilterChange = useCallback((filters: AdvancedFilterValues) => {
    setAdvancedFilters(filters);
  }, []);

  const handleExport = useCallback(() => {
    if (items.length === 0) return;

    const headers = ["ID", "Title", "Summary", "Category", "Severity", "Source", "Published", "Country", "URL"];
    const csvRows = [
      headers.join(","),
      ...items.map((item) =>
        [
          item.id,
          `"${(item.title || "").replace(/"/g, '""')}"`,
          `"${(item.summary || "").replace(/"/g, '""')}"`,
          item.category,
          item.severity,
          `"${(item.source || "").replace(/"/g, '""')}"`,
          item.publishedAt,
          item.countryCode || "",
          item.url || "",
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worldscope-search-${query}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, query]);

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-[9px] font-mono text-hud-muted mb-3">
            <Link href="/" className="text-hud-accent hover:underline">WORLDSCOPE</Link>
            <span>/</span>
            <span className="text-hud-text">SEARCH</span>
          </nav>
          <h1 className="font-mono text-xl font-bold text-hud-text tracking-wide">
            {"\uD83D\uDD0D"} SEARCH: &quot;{query}&quot;
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="font-mono text-[10px] text-hud-muted">
              {isLoading ? "Searching..." : `${items.length} results found`}
            </p>
            <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[10px] text-hud-muted hover:text-hud-text">
              <input
                type="checkbox"
                checked={semantic}
                onChange={(e) => setSemantic(e.target.checked)}
                className="size-3 accent-cyan-500"
              />
              <span>{semantic ? "\u25C6 " : ""}SEMANTIC MODE (AI)</span>
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Advanced Filters */}
        <AdvancedFilters onFilterChange={handleFilterChange} onExport={handleExport} />

        {isLoading ? (
          <div className="text-center py-12">
            <span className="font-mono text-[10px] text-hud-accent animate-pulse">{"\u25C6"} SEARCHING INTEL DATABASE...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-[11px] text-hud-muted">No results for &quot;{query}&quot;</p>
            <Link href="/" className="font-mono text-[10px] text-hud-accent hover:underline mt-4 inline-block">
              {"\u2190"} Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((event: IntelItem) => (
              <article
                key={event.id}
                className="bg-hud-surface border border-hud-border rounded-md p-3 hover:border-hud-muted transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="text-base mt-0.5 shrink-0">
                    {CATEGORY_ICONS[event.category] || "\uD83D\uDCCC"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className="font-mono text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded border"
                        style={{
                          color: SEVERITY_COLORS[event.severity],
                          borderColor: `${SEVERITY_COLORS[event.severity]}40`,
                          backgroundColor: `${SEVERITY_COLORS[event.severity]}10`,
                        }}
                      >
                        {event.severity.toUpperCase()}
                      </span>
                      <span className="font-mono text-[7px] text-hud-muted uppercase">{event.category}</span>
                      {event.countryCode && (
                        <span className="font-mono text-[7px] text-hud-accent">{event.countryCode}</span>
                      )}
                      <span className="font-mono text-[7px] text-hud-muted ml-auto shrink-0">
                        {timeAgo(event.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-[11px] text-hud-text leading-snug mb-0.5">
                      {event.url ? (
                        <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:text-hud-accent transition-colors">
                          {highlightQuery(event.title, query)}
                        </a>
                      ) : highlightQuery(event.title, query)}
                    </h3>
                    {event.summary && (
                      <p className="text-[10px] text-hud-muted leading-relaxed line-clamp-2">
                        {highlightQuery(event.summary, query)}
                      </p>
                    )}
                    <span className="font-mono text-[7px] text-hud-muted mt-1 inline-block">{event.source}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-hud-border bg-hud-surface mt-12">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center">
          <Link href="/" className="font-mono text-[9px] text-hud-accent hover:underline">{"\u2190"} Back to Dashboard</Link>
        </div>
      </footer>
    </div>
  );
}

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-hud-accent/20 text-hud-accent">{part}</mark> : part
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-hud-base flex items-center justify-center"><span className="font-mono text-hud-accent animate-pulse">LOADING...</span></div>}>
      <SearchResults />
    </Suspense>
  );
}
