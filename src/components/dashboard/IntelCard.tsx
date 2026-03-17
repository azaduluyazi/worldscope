"use client";

import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";
import { truncate } from "@/lib/utils/sanitize";

interface IntelCardProps {
  item: IntelItem;
}

export function IntelCard({ item }: IntelCardProps) {
  const severityColor = SEVERITY_COLORS[item.severity];
  const icon = CATEGORY_ICONS[item.category] || "📄";

  const hasGeo = item.lat != null && item.lng != null;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`severity-${item.severity} group block rounded-r-md p-2.5 transition-all duration-200 hover:brightness-125 hover:translate-x-0.5 animate-slide-in`}
    >
      <div className="flex justify-between items-center mb-1">
        <span
          className="font-mono text-[9px] font-bold tracking-wider flex items-center gap-1"
          style={{ color: severityColor }}
        >
          <span className="text-[10px]">{icon}</span>
          {item.severity.toUpperCase()} — {item.category.toUpperCase()}
          {hasGeo && <span className="text-hud-accent text-[7px] ml-1" title="Geo-located">📍</span>}
        </span>
        <span className="font-mono text-[8px] text-hud-muted">
          {timeAgo(item.publishedAt)}
        </span>
      </div>

      <p className="text-[11px] text-hud-text leading-relaxed group-hover:text-white transition-colors">
        {truncate(item.title, 120)}
      </p>

      <div className="flex justify-between items-center mt-1.5">
        <span className="font-mono text-[7px] text-hud-muted">
          {item.source}
        </span>
        <span className="font-mono text-[7px] text-hud-accent opacity-0 group-hover:opacity-100 transition-opacity">
          OPEN →
        </span>
      </div>
    </a>
  );
}
