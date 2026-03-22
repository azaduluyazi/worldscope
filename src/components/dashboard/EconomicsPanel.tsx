"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ImfIndicator {
  country: string;
  countryCode: string;
  indicator: string;
  value: number;
  year: number;
}

interface BigMacEntry {
  countryCode: string;
  countryName: string;
  dollarPrice: number;
  dollarAdj: number;
}

interface BisPolicyRate {
  country: string;
  countryCode: string;
  rate: number;
}

/**
 * Economics Panel — IMF GDP/Inflation + Big Mac Index + BIS Policy Rates.
 */
export function EconomicsPanel() {
  const { data, isLoading } = useSWR("/api/economics?type=all", fetcher, {
    refreshInterval: 3600_000, // 1 hour
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING ECONOMICS...</span>
      </div>
    );
  }

  const gdpData: ImfIndicator[] = (data?.gdp || []).slice(0, 15);
  const inflationData: ImfIndicator[] = (data?.inflation || []).slice(0, 15);
  const bigmacData: BigMacEntry[] = (data?.bigmac || []).slice(0, 15);
  const ratesData: BisPolicyRate[] = (data?.policyRates || []).slice(0, 15);

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="flex flex-col gap-3 p-2">

        {/* GDP Growth */}
        {gdpData.length > 0 && (
          <Section title="GDP GROWTH (%)">
            {gdpData
              .sort((a, b) => b.value - a.value)
              .map((item) => (
                <IndicatorRow
                  key={item.countryCode}
                  label={item.countryCode}
                  value={item.value.toFixed(1) + "%"}
                  color={item.value > 3 ? "#00ff88" : item.value > 0 ? "#ffd000" : "#ff4757"}
                  barPct={Math.min(100, Math.abs(item.value) * 10)}
                />
              ))}
          </Section>
        )}

        {/* Inflation */}
        {inflationData.length > 0 && (
          <Section title="INFLATION (%)">
            {inflationData
              .sort((a, b) => b.value - a.value)
              .map((item) => (
                <IndicatorRow
                  key={item.countryCode}
                  label={item.countryCode}
                  value={item.value.toFixed(1) + "%"}
                  color={item.value > 10 ? "#ff4757" : item.value > 5 ? "#ffd000" : "#00ff88"}
                  barPct={Math.min(100, item.value * 5)}
                />
              ))}
          </Section>
        )}

        {/* Policy Rates */}
        {ratesData.length > 0 && (
          <Section title="CENTRAL BANK RATES">
            {ratesData
              .filter((r) => r.rate > 0)
              .sort((a, b) => b.rate - a.rate)
              .map((item) => (
                <IndicatorRow
                  key={item.countryCode}
                  label={item.countryCode}
                  value={item.rate.toFixed(2) + "%"}
                  color={item.rate > 10 ? "#ff4757" : item.rate > 5 ? "#ffd000" : "#00e5ff"}
                  barPct={Math.min(100, item.rate * 4)}
                />
              ))}
          </Section>
        )}

        {/* Big Mac Index */}
        {bigmacData.length > 0 && (
          <Section title="BIG MAC INDEX ($)">
            {bigmacData
              .sort((a, b) => b.dollarPrice - a.dollarPrice)
              .map((item) => (
                <IndicatorRow
                  key={item.countryCode}
                  label={item.countryCode}
                  value={"$" + item.dollarPrice.toFixed(2)}
                  color="#00e5ff"
                  barPct={Math.min(100, (item.dollarPrice / 8) * 100)}
                />
              ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[8px] text-hud-accent tracking-wider mb-1.5 border-b border-hud-border/30 pb-1">
        ◆ {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function IndicatorRow({ label, value, color, barPct }: { label: string; value: string; color: string; barPct: number }) {
  return (
    <div className="flex items-center gap-2 px-1 py-0.5 hover:bg-hud-surface/30 rounded transition-colors">
      <span className="font-mono text-[8px] text-hud-muted w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-hud-border/20 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[9px] font-bold shrink-0" style={{ color }}>{value}</span>
    </div>
  );
}
