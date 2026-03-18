"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface Endpoint {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; desc: string; required?: boolean }[];
  example: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/intel",
    description: "Aggregated intelligence feed from 500+ sources",
    params: [
      { name: "category", type: "string", desc: "Filter by category (conflict, finance, cyber, tech, natural, aviation, energy, diplomacy, protest, health)" },
      { name: "country", type: "string", desc: "Filter by ISO 3166-1 country code (e.g. TR, US, IL)" },
      { name: "hours", type: "number", desc: "Filter events from last N hours (1-720)" },
      { name: "limit", type: "number", desc: "Max results (default 200, max 500)" },
    ],
    example: "/api/intel?category=conflict&hours=24&limit=50",
  },
  {
    method: "SSE",
    path: "/api/intel/stream",
    description: "Real-time Server-Sent Events stream for new intelligence items",
    example: "const es = new EventSource('/api/intel/stream')",
  },
  {
    method: "GET",
    path: "/api/threat",
    description: "Global threat index score with severity distribution and trend detection",
    example: "/api/threat",
  },
  {
    method: "GET",
    path: "/api/market",
    description: "Financial market data (stocks, crypto, forex, commodities)",
    example: "/api/market",
  },
  {
    method: "GET",
    path: "/api/feeds",
    description: "List active RSS/API feeds with health status",
    params: [
      { name: "category", type: "string", desc: "Filter by category" },
      { name: "active", type: "boolean", desc: "Include inactive feeds (default true)" },
    ],
    example: "/api/feeds?active=false",
  },
  {
    method: "GET",
    path: "/api/feeds/health",
    description: "Feed health summary (total, active, unhealthy, by category)",
    example: "/api/feeds/health",
  },
  {
    method: "GET",
    path: "/api/health",
    description: "Service health check",
    example: "/api/health",
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-severity-low/15 text-severity-low border-severity-low/30",
    POST: "bg-severity-high/15 text-severity-high border-severity-high/30",
    SSE: "bg-hud-accent/15 text-hud-accent border-hud-accent/30",
  };
  return (
    <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded border ${colors[method] || "bg-hud-panel text-hud-muted border-hud-border"}`}>
      {method}
    </span>
  );
}

export function ApiDocsPage() {
  const t = useTranslations("api");
  const [tryResult, setTryResult] = useState<{ path: string; data: string; loading: boolean } | null>(null);

  const handleTry = useCallback(async (path: string) => {
    setTryResult({ path, data: "", loading: true });
    try {
      const res = await fetch(path);
      const data = await res.json();
      setTryResult({ path, data: JSON.stringify(data, null, 2).slice(0, 2000), loading: false });
    } catch (e) {
      setTryResult({ path, data: `Error: ${(e as Error).message}`, loading: false });
    }
  }, []);

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      {/* Header */}
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-[9px] font-mono text-hud-muted mb-3">
            <Link href="/" className="text-hud-accent hover:underline">WORLDSCOPE</Link>
            <span>/</span>
            <span className="text-hud-text">API</span>
          </nav>
          <h1 className="font-mono text-xl font-bold text-hud-text tracking-wide">{t("title")}</h1>
          <p className="font-mono text-[10px] text-hud-muted mt-1">{t("subtitle")}</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-hud-surface border border-hud-border rounded-md p-3">
            <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-1">◆ {t("baseUrl")}</div>
            <code className="font-mono text-[10px] text-hud-text">https://worldscope.app</code>
          </div>
          <div className="bg-hud-surface border border-hud-border rounded-md p-3">
            <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-1">◆ {t("authentication")}</div>
            <p className="font-mono text-[9px] text-hud-muted">{t("authDesc")}</p>
          </div>
          <div className="bg-hud-surface border border-hud-border rounded-md p-3">
            <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-1">◆ {t("rateLimit")}</div>
            <p className="font-mono text-[9px] text-hud-muted">{t("rateLimitDesc")}</p>
          </div>
        </div>

        {/* Endpoints */}
        <div>
          <h2 className="font-mono text-[11px] font-bold text-hud-accent tracking-wider mb-4">◆ {t("endpoints")}</h2>
          <div className="space-y-3">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className="bg-hud-surface border border-hud-border rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MethodBadge method={ep.method} />
                  <code className="font-mono text-[11px] text-hud-text">{ep.path}</code>
                </div>
                <p className="font-mono text-[9px] text-hud-muted mb-2">{ep.description}</p>

                {ep.params && (
                  <div className="mb-2">
                    <div className="font-mono text-[8px] text-hud-accent tracking-wider mb-1">{t("parameters")}:</div>
                    <div className="space-y-0.5">
                      {ep.params.map((p) => (
                        <div key={p.name} className="flex items-start gap-2 font-mono text-[8px]">
                          <code className="text-severity-low shrink-0">{p.name}</code>
                          <span className="text-hud-muted/60">{p.type}</span>
                          <span className="text-hud-muted">{p.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-[9px] text-hud-muted bg-hud-panel rounded px-2 py-1 truncate">
                    {ep.example}
                  </code>
                  {ep.method === "GET" && (
                    <button
                      onClick={() => handleTry(ep.example.startsWith("/") ? ep.example : ep.path)}
                      className="font-mono text-[8px] px-2 py-1 rounded border border-hud-accent/40 bg-hud-accent/10 text-hud-accent hover:bg-hud-accent/20 transition-colors shrink-0"
                    >
                      {t("tryIt")}
                    </button>
                  )}
                </div>

                {/* Try result */}
                {tryResult?.path === (ep.example.startsWith("/") ? ep.example : ep.path) && (
                  <div className="mt-2">
                    {tryResult.loading ? (
                      <span className="font-mono text-[8px] text-hud-accent animate-pulse">{t("loading")}</span>
                    ) : (
                      <pre className="font-mono text-[8px] text-hud-muted bg-hud-base rounded p-2 overflow-x-auto max-h-[200px] overflow-y-auto border border-hud-border">
                        {tryResult.data}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hud-border bg-hud-surface mt-12">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center">
          <Link href="/" className="font-mono text-[9px] text-hud-accent hover:underline">
            ← {t("backToDashboard")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
