"use client";

import { useMemo } from "react";

interface CountrySanctionsProps {
  countryCode: string;
}

interface SanctionRegime {
  regime: string;
  authority: string;
  type: string;
  since: string;
}

/**
 * Known sanctioned countries and their active regimes.
 * Static data — covers major US, EU, and UN sanctions programs.
 */
const SANCTIONED_COUNTRIES: Record<string, SanctionRegime[]> = {
  RU: [
    { regime: "Russia/Ukraine Sanctions", authority: "US/EU/UK", type: "Comprehensive", since: "2014" },
    { regime: "Energy Sector Restrictions", authority: "EU", type: "Sectoral", since: "2022" },
    { regime: "SWIFT Exclusion (Select Banks)", authority: "EU/US", type: "Financial", since: "2022" },
  ],
  IR: [
    { regime: "Iran Nuclear Program", authority: "US/EU/UN", type: "Comprehensive", since: "2006" },
    { regime: "Petroleum Embargo", authority: "US", type: "Sectoral", since: "2012" },
    { regime: "Central Bank Sanctions", authority: "US/EU", type: "Financial", since: "2012" },
  ],
  KP: [
    { regime: "DPRK WMD Program", authority: "UN/US/EU", type: "Comprehensive", since: "2006" },
    { regime: "Luxury Goods Ban", authority: "UN", type: "Trade", since: "2006" },
    { regime: "Financial Isolation", authority: "US", type: "Financial", since: "2016" },
  ],
  SY: [
    { regime: "Syria Sanctions", authority: "US/EU", type: "Comprehensive", since: "2011" },
    { regime: "Caesar Act", authority: "US", type: "Comprehensive", since: "2020" },
  ],
  CU: [
    { regime: "Cuba Embargo", authority: "US", type: "Comprehensive", since: "1962" },
    { regime: "Cuba Restrictive Measures", authority: "EU (partial)", type: "Diplomatic", since: "1996" },
  ],
  VE: [
    { regime: "Venezuela Sanctions", authority: "US/EU", type: "Targeted", since: "2017" },
    { regime: "Oil Sector Restrictions", authority: "US", type: "Sectoral", since: "2019" },
  ],
  BY: [
    { regime: "Belarus Sanctions", authority: "US/EU/UK", type: "Targeted", since: "2020" },
    { regime: "Aviation & Trade Restrictions", authority: "EU", type: "Sectoral", since: "2021" },
  ],
  MM: [
    { regime: "Myanmar Military Sanctions", authority: "US/EU/UK", type: "Targeted", since: "2021" },
  ],
  AF: [
    { regime: "Taliban Sanctions", authority: "UN/US", type: "Targeted", since: "2021" },
  ],
  SD: [
    { regime: "Sudan Sanctions", authority: "US", type: "Comprehensive", since: "1997" },
  ],
  SO: [
    { regime: "Somalia Arms Embargo", authority: "UN", type: "Arms", since: "1992" },
  ],
  YE: [
    { regime: "Yemen Targeted Sanctions", authority: "UN/US", type: "Targeted", since: "2014" },
  ],
  LB: [
    { regime: "Lebanon (Hezbollah) Sanctions", authority: "US", type: "Targeted", since: "2015" },
  ],
  CD: [
    { regime: "DRC Arms Embargo", authority: "UN/EU", type: "Arms", since: "2003" },
  ],
  CF: [
    { regime: "CAR Arms Embargo", authority: "UN/EU", type: "Arms", since: "2013" },
  ],
  LY: [
    { regime: "Libya Arms Embargo", authority: "UN/EU", type: "Arms", since: "2011" },
  ],
  ML: [
    { regime: "Mali Targeted Sanctions", authority: "EU", type: "Targeted", since: "2020" },
  ],
  NI: [
    { regime: "Nicaragua Sanctions", authority: "US/EU", type: "Targeted", since: "2018" },
  ],
  CN: [
    { regime: "Xinjiang/XUAR Sanctions", authority: "US/EU/UK", type: "Targeted", since: "2020" },
    { regime: "Tech Export Controls", authority: "US", type: "Sectoral", since: "2022" },
  ],
};

const TYPE_COLORS: Record<string, string> = {
  Comprehensive: "#ff4757",
  Targeted: "#ffd000",
  Sectoral: "#00e5ff",
  Financial: "#8a5cf6",
  Arms: "#ff6b81",
  Trade: "#ffa502",
  Diplomatic: "#70a1ff",
};

export function CountrySanctions({ countryCode }: CountrySanctionsProps) {
  const sanctions = useMemo(
    () => SANCTIONED_COUNTRIES[countryCode.toUpperCase()] || [],
    [countryCode]
  );

  return (
    <div className="bg-hud-surface border border-hud-border rounded-lg p-3">
      <h3 className="font-mono text-[11px] font-bold text-hud-text tracking-wider uppercase mb-3 flex items-center gap-1.5">
        <span>{"\uD83D\uDEAB"}</span>
        SANCTIONS TRACKER
      </h3>

      {sanctions.length === 0 ? (
        <div className="py-3 text-center">
          <p className="font-mono text-[9px] text-hud-muted">
            No active international sanctions for {countryCode}
          </p>
          <p className="font-mono text-[7px] text-hud-muted mt-1">
            {"\u2713"} Not currently subject to major US/EU/UN sanctions programs
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#ff4757]" />
            <span className="font-mono text-[8px] text-[#ff4757] font-bold">
              {sanctions.length} ACTIVE REGIME{sanctions.length > 1 ? "S" : ""}
            </span>
          </div>

          {sanctions.map((s, i) => (
            <div
              key={i}
              className="bg-hud-base border border-hud-border rounded px-2 py-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[9px] text-hud-text leading-snug">
                    {s.regime}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[7px] text-hud-muted">
                      {s.authority}
                    </span>
                    <span className="font-mono text-[7px] text-hud-muted">
                      Since {s.since}
                    </span>
                  </div>
                </div>
                <span
                  className="font-mono text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded shrink-0"
                  style={{
                    color: TYPE_COLORS[s.type] || "#8a5cf6",
                    backgroundColor: `${TYPE_COLORS[s.type] || "#8a5cf6"}15`,
                  }}
                >
                  {s.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
