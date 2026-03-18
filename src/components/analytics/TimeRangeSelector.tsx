"use client";

import { useTranslations } from "next-intl";
import type { TimeRange } from "@/hooks/useAnalytics";

const RANGES: { value: TimeRange; key: string }[] = [
  { value: 6, key: "last6h" },
  { value: 24, key: "last24h" },
  { value: 168, key: "last7d" },
  { value: 720, key: "last30d" },
];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const t = useTranslations("analytics");

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[8px] text-hud-muted tracking-wider mr-2">
        {t("timeRange")}
      </span>
      {RANGES.map(({ value: rv, key }) => (
        <button
          key={rv}
          onClick={() => onChange(rv)}
          className={`font-mono text-[9px] px-2.5 py-1 rounded border transition-all ${
            value === rv
              ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent"
              : "bg-hud-panel border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-muted"
          }`}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
}
