"use client";

const LEVEL_COLORS: Record<string, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  elevated: "#00e5ff",
  low: "#00ff88",
};

interface ImpactBadgeProps {
  score: number;
  level: string;
  compact?: boolean;
}

/**
 * Mini gauge arc for full mode — renders an SVG arc proportional to score.
 */
function MiniGauge({ score, color }: { score: number; color: string }) {
  // Arc goes from -120deg to +120deg (240deg total sweep)
  const radius = 14;
  const cx = 16;
  const cy = 16;
  const startAngle = -120;
  const sweep = 240;
  const endAngle = startAngle + (sweep * score) / 100;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcStart = {
    x: cx + radius * Math.cos(toRad(startAngle)),
    y: cy + radius * Math.sin(toRad(startAngle)),
  };
  const arcEnd = {
    x: cx + radius * Math.cos(toRad(endAngle)),
    y: cy + radius * Math.sin(toRad(endAngle)),
  };
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  // Background arc (full sweep, dim)
  const bgEnd = {
    x: cx + radius * Math.cos(toRad(startAngle + sweep)),
    y: cy + radius * Math.sin(toRad(startAngle + sweep)),
  };
  const bgLargeArc = sweep > 180 ? 1 : 0;

  return (
    <svg width={32} height={32} viewBox="0 0 32 32" className="absolute inset-0">
      {/* Background track */}
      <path
        d={`M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${bgLargeArc} 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none"
        stroke={`${color}20`}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Active arc */}
      {score > 0 && (
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
        />
      )}
    </svg>
  );
}

export function ImpactBadge({ score, level, compact = false }: ImpactBadgeProps) {
  const color = LEVEL_COLORS[level] || LEVEL_COLORS.low;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-0.5 font-mono text-[8px] tabular-nums"
        title={`Impact: ${score}/100 (${level})`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}60` }}
        />
        <span style={{ color }}>{score}</span>
      </span>
    );
  }

  // Full mode: mini gauge arc + score
  return (
    <span
      className="relative inline-flex items-center justify-center w-8 h-8 flex-shrink-0"
      title={`Impact: ${score}/100 (${level})`}
    >
      <MiniGauge score={score} color={color} />
      <span
        className="relative z-10 font-mono text-[8px] font-bold tabular-nums"
        style={{ color, textShadow: `0 0 4px ${color}40` }}
      >
        {score}
      </span>
    </span>
  );
}
