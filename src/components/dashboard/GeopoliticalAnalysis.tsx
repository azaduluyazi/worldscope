"use client";

import { useState, useCallback } from "react";

/* ── models ── */
const ANALYSIS_MODELS = [
  {
    id: "grand-chessboard",
    label: "Grand Chessboard",
    prompt:
      "Analyze this country through Zbigniew Brzezinski's Grand Chessboard framework. Focus on geopolitical pivots, strategic players, Eurasian power dynamics, and US interests.",
  },
  {
    id: "prisoners-of-geography",
    label: "Prisoners of Geography",
    prompt:
      "Analyze this country through Tim Marshall's Prisoners of Geography framework. Focus on rivers, mountains, access to sea, natural resources, borders, and how geography shapes politics.",
  },
  {
    id: "central-bank",
    label: "Central Bank Analysis",
    prompt:
      "Analyze this country from a central banking and monetary policy perspective. Cover interest rates, inflation, currency stability, foreign reserves, debt-to-GDP, and fiscal policy risks.",
  },
] as const;

/* ── country list (top 40 strategic countries) ── */
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CN", name: "China" },
  { code: "RU", name: "Russia" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "TR", name: "Turkey" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IR", name: "Iran" },
  { code: "IL", name: "Israel" },
  { code: "UA", name: "Ukraine" },
  { code: "PL", name: "Poland" },
  { code: "KR", name: "South Korea" },
  { code: "TW", name: "Taiwan" },
  { code: "AU", name: "Australia" },
  { code: "ID", name: "Indonesia" },
  { code: "PK", name: "Pakistan" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
  { code: "ZA", name: "South Africa" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "TH", name: "Thailand" },
  { code: "ET", name: "Ethiopia" },
  { code: "CO", name: "Colombia" },
  { code: "MY", name: "Malaysia" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "FI", name: "Finland" },
  { code: "GR", name: "Greece" },
  { code: "SY", name: "Syria" },
  { code: "IQ", name: "Iraq" },
  { code: "AF", name: "Afghanistan" },
  { code: "VE", name: "Venezuela" },
];

interface GeopoliticalAnalysisProps {
  className?: string;
}

export function GeopoliticalAnalysis({ className = "" }: GeopoliticalAnalysisProps) {
  const [modelId, setModelId] = useState<string>(ANALYSIS_MODELS[0].id);
  const [countryCode, setCountryCode] = useState("US");
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedModel = ANALYSIS_MODELS.find((m) => m.id === modelId) ?? ANALYSIS_MODELS[0];
  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);

  const handleAnalyze = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setAnalysis("");
    setError("");

    try {
      const prompt = `${selectedModel.prompt}\n\nCountry: ${selectedCountry?.name ?? countryCode}\n\nProvide a concise, structured intelligence brief (300-400 words). Use bullet points where appropriate. End with a risk assessment (low/medium/high/critical).`;

      const res = await fetch("/api/ai/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      setAnalysis(data.brief || data.text || data.content || "No analysis generated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedModel, selectedCountry, countryCode]);

  return (
    <div className={`h-full overflow-auto custom-scrollbar flex flex-col ${className}`}>
      {/* header */}
      <div className="sticky top-0 z-10 bg-hud-panel border-b border-hud-border/50 px-2.5 py-1.5">
        <span className="font-mono text-[9px] text-hud-accent tracking-widest uppercase">
          Geopolitical Analysis
        </span>
      </div>

      {/* controls */}
      <div className="flex flex-col gap-2 px-2.5 py-2">
        {/* model select */}
        <div>
          <label className="font-mono text-[7px] text-hud-muted tracking-wider block mb-0.5">
            FRAMEWORK
          </label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full bg-hud-surface/50 border border-hud-border/50 rounded px-2 py-1 font-mono text-[9px] text-hud-text outline-none focus:border-hud-accent/50 appearance-none"
          >
            {ANALYSIS_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* country select */}
        <div>
          <label className="font-mono text-[7px] text-hud-muted tracking-wider block mb-0.5">
            COUNTRY
          </label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full bg-hud-surface/50 border border-hud-border/50 rounded px-2 py-1 font-mono text-[9px] text-hud-text outline-none focus:border-hud-accent/50 appearance-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full bg-hud-accent/20 border border-hud-accent/40 rounded py-1.5 font-mono text-[9px] text-hud-accent hover:bg-hud-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
        >
          {isLoading ? "GENERATING ANALYSIS..." : "ANALYZE"}
        </button>
      </div>

      {/* loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border border-hud-accent/50 border-t-hud-accent rounded-full animate-spin" />
            <span className="font-mono text-[8px] text-hud-accent animate-pulse">
              GENERATING ANALYSIS...
            </span>
          </div>
        </div>
      )}

      {/* error */}
      {error && (
        <div className="mx-2.5 mb-2 bg-red-500/10 border border-red-500/30 rounded p-2">
          <span className="font-mono text-[9px] text-red-400">{error}</span>
        </div>
      )}

      {/* analysis output */}
      {analysis && !isLoading && (
        <div className="flex-1 px-2.5 pb-2">
          <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2.5">
            <div className="font-mono text-[8px] text-hud-accent tracking-wider mb-2">
              {selectedModel.label.toUpperCase()} &mdash; {selectedCountry?.name.toUpperCase()}
            </div>
            <div className="font-mono text-[9px] text-hud-text leading-relaxed whitespace-pre-wrap">
              {analysis}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
