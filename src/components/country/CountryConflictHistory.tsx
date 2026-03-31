"use client";

import useSWR from "swr";
import type { IntelItem, IntelFeedResponse } from "@/types/intel";
import { SEVERITY_COLORS } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";

interface CountryConflictHistoryProps {
  countryCode: string;
}

const fetcher = (url: string): Promise<IntelItem[]> =>
  fetch(url)
    .then((r) => r.json())
    .then((data: IntelFeedResponse) => data.items || []);

export function CountryConflictHistory({ countryCode }: CountryConflictHistoryProps) {
  const { data: events, isLoading, error } = useSWR(
    `/api/intel?category=conflict&country=${countryCode}&limit=30&hours=720`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return (
    <div className="bg-hud-surface border border-hud-border rounded-lg p-3">
      <h3 className="font-mono text-[11px] font-bold text-hud-text tracking-wider uppercase mb-3 flex items-center gap-1.5">
        <span>{"\u2694\uFE0F"}</span>
        CONFLICT TIMELINE
        <span className="font-mono text-[7px] text-hud-muted font-normal ml-auto">
          LAST 30 DAYS
        </span>
      </h3>

      {isLoading ? (
        <div className="py-4 text-center">
          <span className="font-mono text-[9px] text-hud-accent animate-pulse">
            {"\u25C6"} LOADING CONFLICT DATA...
          </span>
        </div>
      ) : error ? (
        <p className="font-mono text-[9px] text-hud-muted text-center py-4">
          Failed to load conflict data
        </p>
      ) : !events || events.length === 0 ? (
        <div className="py-4 text-center">
          <p className="font-mono text-[9px] text-hud-muted">
            No recent conflicts reported for {countryCode}
          </p>
          <p className="font-mono text-[7px] text-hud-muted mt-1">
            {"\u2713"} Area appears stable in the last 30 days
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[5px] top-1 bottom-1 w-px bg-hud-border" />

          <div className="space-y-2 pl-5">
            {events.map((event) => (
              <div key={event.id} className="relative">
                {/* Timeline dot */}
                <div
                  className="absolute -left-5 top-1 w-[10px] h-[10px] rounded-full border-2"
                  style={{
                    borderColor: SEVERITY_COLORS[event.severity],
                    backgroundColor: `${SEVERITY_COLORS[event.severity]}30`,
                  }}
                />

                <div className="bg-hud-base border border-hud-border rounded px-2 py-1.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="font-mono text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded"
                      style={{
                        color: SEVERITY_COLORS[event.severity],
                        backgroundColor: `${SEVERITY_COLORS[event.severity]}15`,
                      }}
                    >
                      {event.severity}
                    </span>
                    <span className="font-mono text-[7px] text-hud-muted ml-auto">
                      {timeAgo(event.publishedAt)}
                    </span>
                  </div>
                  <p className="font-mono text-[9px] text-hud-text leading-snug line-clamp-2">
                    {event.url ? (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-hud-accent transition-colors"
                      >
                        {event.title}
                      </a>
                    ) : (
                      event.title
                    )}
                  </p>
                  <span className="font-mono text-[7px] text-hud-muted mt-0.5 inline-block">
                    {event.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
