import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation — WorldScope",
  description: "WorldScope public API endpoints for intelligence, market, flight, and vessel data.",
  alternates: { canonical: "/api-docs" },
};

const ENDPOINTS = [
  { method: "GET", path: "/api/intel", description: "Global intelligence feed", params: "limit, hours, lang, category, severity", example: "/api/intel?limit=10&hours=24&lang=en" },
  { method: "GET", path: "/api/intel/stream", description: "Real-time SSE event stream", params: "none (Server-Sent Events)", example: "curl -N http://localhost:3000/api/intel/stream" },
  { method: "GET", path: "/api/intel/insights", description: "Anomalies, entities, sentiment analysis", params: "hours", example: "/api/intel/insights?hours=24" },
  { method: "GET", path: "/api/intel/anomalies", description: "Anomaly detection", params: "hours", example: "/api/intel/anomalies?hours=24" },
  { method: "GET", path: "/api/market", description: "Market data (crypto, indices)", params: "none", example: "/api/market" },
  { method: "GET", path: "/api/flights", description: "Global aircraft positions (OpenSky)", params: "none", example: "/api/flights" },
  { method: "GET", path: "/api/flights/search", description: "Search specific flight by callsign", params: "q (IATA code)", example: "/api/flights/search?q=TK" },
  { method: "GET", path: "/api/vessels", description: "Maritime AIS vessel positions", params: "none", example: "/api/vessels" },
  { method: "GET", path: "/api/sports", description: "Aggregated sports scores and news", params: "none", example: "/api/sports" },
  { method: "GET", path: "/api/weather", description: "Global weather for 30 major cities", params: "none", example: "/api/weather" },
  { method: "GET", path: "/api/cyber-threats", description: "CVEs, ransomware, phishing data", params: "none", example: "/api/cyber-threats" },
  { method: "GET", path: "/api/predictions", description: "Prediction markets data", params: "none", example: "/api/predictions" },
  { method: "GET", path: "/api/threat", description: "Global threat index score", params: "none", example: "/api/threat" },
  { method: "GET", path: "/api/health", description: "System health check", params: "none", example: "/api/health" },
  { method: "GET", path: "/api/trending", description: "Trending topics", params: "none", example: "/api/trending" },
  { method: "GET", path: "/api/translate", description: "Translate text", params: "text, from, to", example: "/api/translate?text=hello&to=tr" },
];

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-hud-base text-hud-text p-6 font-mono">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-hud-accent mb-1 tracking-wider">WORLDSCOPE API</h1>
        <p className="text-hud-muted text-xs mb-6">Public REST endpoints — rate limited to 60 req/min per IP</p>

        <div className="space-y-3">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="border border-hud-border rounded-sm p-3 hover:bg-hud-surface transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-hud-accent/10 text-hud-accent">{ep.method}</span>
                <code className="text-sm text-hud-text">{ep.path}</code>
              </div>
              <p className="text-xs text-hud-muted mb-1">{ep.description}</p>
              <div className="text-[10px] text-hud-muted">
                <span className="text-hud-accent">Params:</span> {ep.params}
              </div>
              <div className="text-[10px] text-hud-muted mt-0.5">
                <span className="text-hud-accent">Try:</span>{" "}
                <code className="text-hud-text">{ep.example}</code>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-[10px] text-hud-muted border-t border-hud-border pt-4">
          <p>All endpoints return JSON. Authenticated admin routes require <code>x-admin-key</code> header.</p>
          <p className="mt-1">SSE stream sends <code>event: intel</code> with JSON data for new events.</p>
        </div>
      </div>
    </div>
  );
}
