"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import useSWR from "swr";
import { useLocale } from "next-intl";
import Link from "next/link";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelFeedResponse, IntelItem } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SearchResults() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const query = searchParams.get("q") || "";

  const { data, isLoading } = useSWR<IntelFeedResponse>(
    query.length >= 2 ? `/api/intel?q=${encodeURIComponent(query)}&lang=${locale}&limit=100` : null,
    fetcher
  );

  const items = data?.items || [];

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
            🔍 SEARCH: &quot;{query}&quot;
          </h1>
          <p className="font-mono text-[10px] text-hud-muted mt-1">
            {isLoading ? "Searching..." : `${items.length} results found`}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <span className="font-mono text-[10px] text-hud-accent animate-pulse">◆ SEARCHING INTEL DATABASE...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-[11px] text-hud-muted">No results for &quot;{query}&quot;</p>
            <Link href="/" className="font-mono text-[10px] text-hud-accent hover:underline mt-4 inline-block">
              ← Back to Dashboard
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
                    {CATEGORY_ICONS[event.category] || "📌"}
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
          <Link href="/" className="font-mono text-[9px] text-hud-accent hover:underline">← Back to Dashboard</Link>
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
