"use client";

import useSWR from "swr";

interface EconomicData {
  indicator: string;
  indicatorId: string;
  value: number | null;
  year: number;
}

interface CountryEconomicsProps {
  countryCode: string;
}

/** World Bank indicator IDs */
const INDICATORS = [
  { id: "NY.GDP.MKTP.KD.ZG", label: "GDP Growth", unit: "%" },
  { id: "FP.CPI.TOTL.ZG", label: "Inflation (CPI)", unit: "%" },
  { id: "SL.UEM.TOTL.ZS", label: "Unemployment", unit: "%" },
  { id: "NE.TRD.GNFS.ZS", label: "Trade (% of GDP)", unit: "%" },
  { id: "NY.GDP.PCAP.CD", label: "GDP per Capita", unit: "$" },
  { id: "SP.POP.TOTL", label: "Population", unit: "" },
];

const WB_BASE = "https://api.worldbank.org/v2";

async function fetchAllIndicators(countryCode: string): Promise<Map<string, EconomicData>> {
  const currentYear = new Date().getFullYear();
  const results = await Promise.allSettled(
    INDICATORS.map(async (ind) => {
      const res = await fetch(
        `${WB_BASE}/country/${countryCode.toLowerCase()}/indicator/${ind.id}?format=json&date=${currentYear - 5}:${currentYear}&per_page=10`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const records = data?.[1] || [];
      const valid = records.filter((r: Record<string, unknown>) => r.value != null);
      if (valid.length === 0) return null;
      const latest = valid[0];
      return {
        indicatorId: ind.id,
        indicator: (latest.indicator as Record<string, string>)?.value || "",
        value: latest.value as number,
        year: parseInt(String(latest.date)),
      } satisfies EconomicData;
    })
  );

  const map = new Map<string, EconomicData>();
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      map.set(INDICATORS[i].id, r.value);
    }
  });
  return map;
}

function formatValue(value: number, unit: string): string {
  if (unit === "$") {
    return value >= 1000
      ? `$${(value / 1000).toFixed(1)}K`
      : `$${value.toFixed(0)}`;
  }
  if (unit === "%") {
    return `${value.toFixed(1)}%`;
  }
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function CountryEconomics({ countryCode }: CountryEconomicsProps) {
  const { data, isLoading, error } = useSWR(
    ["country-economics", countryCode],
    ([, code]) => fetchAllIndicators(code),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return (
    <div className="bg-hud-surface border border-hud-border rounded-lg p-3">
      <h3 className="font-mono text-[11px] font-bold text-hud-text tracking-wider uppercase mb-3 flex items-center gap-1.5">
        <span className="text-hud-accent">{"$"}</span>
        ECONOMIC INDICATORS
      </h3>

      {isLoading ? (
        <div className="py-4 text-center">
          <span className="font-mono text-[9px] text-hud-accent animate-pulse">
            {"\u25C6"} LOADING ECONOMIC DATA...
          </span>
        </div>
      ) : error ? (
        <p className="font-mono text-[9px] text-hud-muted text-center py-4">
          Failed to load economic data
        </p>
      ) : !data || data.size === 0 ? (
        <p className="font-mono text-[9px] text-hud-muted text-center py-4">
          No economic data available for {countryCode}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INDICATORS.map((ind) => {
            const item = data.get(ind.id);
            if (!item) return null;
            return (
              <div
                key={ind.id}
                className="bg-hud-base border border-hud-border rounded px-2 py-1.5"
              >
                <div className="font-mono text-[7px] text-hud-muted uppercase tracking-wider">
                  {ind.label}
                </div>
                <div className="font-mono text-[11px] text-hud-text font-bold mt-0.5">
                  {formatValue(item.value!, ind.unit)}
                </div>
                <div className="font-mono text-[7px] text-hud-muted">
                  {item.year}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
