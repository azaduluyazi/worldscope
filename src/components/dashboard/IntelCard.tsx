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

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`severity-${item.severity} block rounded-r-md p-2.5 transition-all hover:brightness-125 animate-slide-in`}
    >
      <div className="flex justify-between items-center mb-1">
        <span
          className="font-mono text-[9px] font-bold tracking-wider"
          style={{ color: severityColor }}
        >
          ⬡ {item.severity.toUpperCase()} — {item.category.toUpperCase()}
        </span>
        <span className="font-mono text-[8px] text-hud-muted">
          {timeAgo(item.publishedAt)}
        </span>
      </div>

      <p className="text-[11px] text-hud-text leading-relaxed">
        {truncate(item.title, 120)}
      </p>

      <div className="flex justify-between items-center mt-1.5">
        <span className="font-mono text-[7px] text-hud-muted">
          {item.source}
        </span>
      </div>
    </a>
  );
}
