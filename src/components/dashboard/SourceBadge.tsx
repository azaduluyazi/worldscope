"use client";

/**
 * SourceBadge — Visual indicator of source reliability tier.
 *
 * Tier 1 (green): Official/institutional (USGS, NASA, WHO, OREF)
 * Tier 2 (cyan): Established aggregators (GDELT, ReliefWeb, NVD)
 * Tier 3 (yellow): Specialized/community sources
 * Tier 4 (gray): News/RSS aggregators
 *
 * Score tooltip shows the dynamic reliability score (0.0-1.0)
 */

const TIER_CONFIG = {
  1: { color: "#00ff88", label: "T1", title: "Official Source" },
  2: { color: "#00e5ff", label: "T2", title: "Verified Aggregator" },
  3: { color: "#ffd000", label: "T3", title: "Specialized Source" },
  4: { color: "#64748b", label: "T4", title: "News Feed" },
} as const;

interface SourceBadgeProps {
  tier: 1 | 2 | 3 | 4;
  score: number;
  compact?: boolean;
}

export function SourceBadge({ tier, score, compact = true }: SourceBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[4];
  const pct = Math.round(score * 100);

  if (compact) {
    return (
      <span
        className="inline-flex items-center"
        title={`${config.title} — Reliability: ${pct}%`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 font-mono text-[7px] px-1 py-0.5 rounded border"
      style={{
        color: config.color,
        borderColor: `${config.color}40`,
        backgroundColor: `${config.color}10`,
      }}
      title={`${config.title} — Reliability: ${pct}%`}
    >
      <span
        className="w-1 h-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
