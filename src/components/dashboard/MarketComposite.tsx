"use client";

import useSWR from "swr";

/* ── types ── */
interface CompositeData {
  composite: number; // -100 to +100
  signals: Array<{
    name: string;
    value: number; // -100 to +100
    weight: number;
  }>;
  label: string;
  updatedAt: string;
}

interface MarketCompositeProps {
  className?: string;
}

/* ── demo fallback ── */
const DEMO_DATA: CompositeData = {
  composite: 23,
  signals: [
    { name: "VIX", value: -15, weight: 0.2 },
    { name: "PUT/CALL", value: 10, weight: 0.15 },
    { name: "BREADTH", value: 45, weight: 0.15 },
    { name: "JUNK SPREAD", value: -5, weight: 0.15 },
    { name: "MOMENTUM", value: 60, weight: 0.15 },
    { name: "SAFE HAVEN", value: 20, weight: 0.1 },
    { name: "FUNDING", value: 30, weight: 0.1 },
  ],
  label: "Greed",
  updatedAt: new Date().toISOString(),
};

/* ── helpers ── */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function compositeLabel(score: number): { label: string; color: string } {
  if (score <= -60) return { label: "EXTREME FEAR", color: "#8b0000" };
  if (score <= -20) return { label: "FEAR", color: "#ff4757" };
  if (score <= 20) return { label: "NEUTRAL", color: "#ffd000" };
  if (score <= 60) return { label: "GREED", color: "#00c96a" };
  return { label: "EXTREME GREED", color: "#00ff88" };
}

function signalColor(val: number): string {
  if (val <= -40) return "#ff4757";
  if (val <= -10) return "#ff8c00";
  if (val <= 10) return "#ffd000";
  if (val <= 40) return "#00c96a";
  return "#00ff88";
}

/* ── gauge SVG ── */
function Gauge({ score }: { score: number }) {
  // score: -100 to +100 → angle: -135 to +135 (270° arc)
  const normalised = Math.max(-100, Math.min(100, score));
  const angle = (normalised / 100) * 135;
  const cx = 80;
  const cy = 80;
  const r = 60;

  // arc gradient stops (from -135 to +135)
  const arcStops = [
    { offset: "0%", color: "#8b0000" },
    { offset: "25%", color: "#ff4757" },
    { offset: "50%", color: "#ffd000" },
    { offset: "75%", color: "#00c96a" },
    { offset: "100%", color: "#00ff88" },
  ];

  // build arc path (270°, from -135° to +135°)
  const startAngle = -135;
  const endAngle = 135;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));

  const arcPath = `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`;

  // needle
  const needleAngle = angle - 90; // -90 to orient upward at 0
  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(toRad(needleAngle));
  const ny = cy + needleLen * Math.sin(toRad(needleAngle));

  return (
    <svg viewBox="0 0 160 120" className="w-full max-w-[200px]">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          {arcStops.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>

      {/* arc background */}
      <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />

      {/* arc gradient */}
      <path d={arcPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth="6" strokeLinecap="round" />

      {/* needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

      {/* center dot */}
      <circle cx={cx} cy={cy} r="3" fill="#ffffff" />

      {/* score text */}
      <text x={cx} y={cy + 20} textAnchor="middle" className="font-mono" fill="#ffffff" fontSize="14" fontWeight="bold">
        {normalised > 0 ? `+${normalised}` : normalised}
      </text>
    </svg>
  );
}

/* ── component ── */
export function MarketComposite({ className = "" }: MarketCompositeProps) {
  const { data: apiData, isLoading } = useSWR<CompositeData>(
    "/api/analytics/market-composite",
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
      onErrorRetry: () => {}, // silent fail, use demo
    },
  );

  const data = apiData ?? DEMO_DATA;
  const { label, color } = compositeLabel(data.composite);

  if (isLoading && !apiData) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <span className="font-mono text-[9px] text-hud-muted animate-pulse">
          LOADING COMPOSITE...
        </span>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto custom-scrollbar ${className}`}>
      {/* header */}
      <div className="sticky top-0 z-10 bg-hud-panel border-b border-hud-border/50 px-2.5 py-1.5">
        <span className="font-mono text-[9px] text-hud-accent tracking-widest uppercase">
          Market Composite Gauge
        </span>
      </div>

      <div className="flex flex-col items-center px-2.5 py-3">
        {/* gauge */}
        <Gauge score={data.composite} />

        {/* label */}
        <span className="font-mono text-[11px] font-bold tracking-wider mt-1" style={{ color }}>
          {label}
        </span>

        {/* 7-signal breakdown */}
        <div className="w-full mt-4 flex flex-col gap-1.5">
          <div className="font-mono text-[8px] text-hud-accent tracking-wider">
            7-SIGNAL BREAKDOWN
          </div>
          {data.signals.map((sig) => (
            <div key={sig.name} className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-hud-muted w-20 truncate">
                {sig.name}
              </span>
              <div className="flex-1 h-[4px] bg-hud-border/30 rounded-full relative overflow-hidden">
                {/* center line */}
                <div className="absolute left-1/2 top-0 h-full w-px bg-hud-border/50" />
                {/* bar from center */}
                <div
                  className="absolute top-0 h-full rounded-full transition-all duration-300"
                  style={{
                    left: sig.value >= 0 ? "50%" : `${50 + (sig.value / 100) * 50}%`,
                    width: `${(Math.abs(sig.value) / 100) * 50}%`,
                    backgroundColor: signalColor(sig.value),
                  }}
                />
              </div>
              <span
                className="font-mono text-[8px] w-8 text-right font-bold"
                style={{ color: signalColor(sig.value) }}
              >
                {sig.value > 0 ? "+" : ""}
                {sig.value}
              </span>
            </div>
          ))}
        </div>

        {/* timestamp */}
        {data.updatedAt && (
          <div className="font-mono text-[7px] text-hud-muted mt-3">
            UPDATED: {new Date(data.updatedAt).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
}
