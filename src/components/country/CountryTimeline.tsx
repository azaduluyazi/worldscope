"use client";

import { useTranslations } from "next-intl";
import type { IntelItem } from "@/types/intel";

interface CountryTimelineProps {
  items: IntelItem[];
}

interface Bucket {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

function computeBuckets(items: IntelItem[]) {
  const now = Date.now();
  const buckets: Bucket[] = Array.from({ length: 12 }, () => ({
    total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0,
  }));

  for (const item of items) {
    const ageMs = now - new Date(item.publishedAt).getTime();
    const idx = Math.min(11, Math.max(0, Math.floor(ageMs / (2 * 60 * 60 * 1000))));
    const b = buckets[idx];
    b.total++;
    switch (item.severity) {
      case "critical": b.critical++; break;
      case "high": b.high++; break;
      case "medium": b.medium++; break;
      case "low": b.low++; break;
      case "info": b.info++; break;
    }
  }

  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));
  return { buckets, maxBucket };
}

export function CountryTimeline({ items }: CountryTimelineProps) {
  const t = useTranslations("country");
  const { buckets, maxBucket } = computeBuckets(items);

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("timeline")}
      </div>
      <div className="flex items-end gap-[3px] h-16">
        {buckets.map((bucket, i) => {
          const height = Math.max(2, (bucket.total / maxBucket) * 100);
          const color =
            bucket.critical > 0 ? "#ff4757" :
            bucket.high > 0 ? "#ffd000" :
            bucket.medium > 0 ? "#00e5ff" : "#00ff88";
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-500 relative group cursor-default"
              style={{
                height: `${height}%`,
                backgroundColor: `${color}80`,
                border: `1px solid ${color}40`,
                minHeight: 2,
              }}
              title={`${(11 - i) * 2}-${(11 - i) * 2 + 2}h ago: ${bucket.total} events`}
            >
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[6px] text-hud-muted opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {bucket.total}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[6px] text-hud-muted">24h</span>
        <span className="font-mono text-[6px] text-hud-muted">now</span>
      </div>
    </div>
  );
}
