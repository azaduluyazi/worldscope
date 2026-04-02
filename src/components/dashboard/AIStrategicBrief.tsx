"use client";

import useSWR from "swr";
import { timeAgo } from "@/lib/utils/date";

interface BriefData {
  summary: string;
  topRisks: string[];
  generatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AIStrategicBrief() {
  const { data, isLoading } = useSWR<BriefData>("/api/ai/strategic-brief", fetcher, {
    refreshInterval: 300_000, // 5 min
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="glass-panel rounded-lg p-3">
        <div className="hud-label text-[8px] mb-2">◆ AI Strategic Brief</div>
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-hud-border rounded w-3/4" />
          <div className="h-3 bg-hud-border rounded w-full" />
          <div className="h-3 bg-hud-border rounded w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="hud-label text-[8px]">◆ AI Strategic Brief</span>
        {data?.generatedAt && (
          <span className="font-mono text-[7px] text-hud-muted">
            {timeAgo(data.generatedAt)}
          </span>
        )}
      </div>

      {data?.summary ? (
        <>
          <p className="text-[10px] text-hud-text leading-relaxed mb-2">
            {data.summary}
          </p>
          {data.topRisks && data.topRisks.length > 0 && (
            <div className="border-t border-hud-border pt-2 mt-2">
              <div className="font-mono text-[7px] text-hud-muted tracking-wider mb-1">TOP RISKS</div>
              <div className="flex flex-col gap-1">
                {data.topRisks.slice(0, 5).map((risk, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[8px] text-severity-critical font-mono font-bold shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-[9px] text-hud-muted leading-snug">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-[9px] text-hud-muted italic">
          No strategic brief available. Generating...
        </p>
      )}
    </div>
  );
}
