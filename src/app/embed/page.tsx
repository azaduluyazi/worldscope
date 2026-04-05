import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Embed WorldScope Widget — Developer Tools",
  description:
    "Add real-time global intelligence to your website with WorldScope embeddable widgets. Free, no API key required.",
  alternates: { canonical: "https://troiamedia.com/embed" },
};

const WIDGET_TYPES = [
  {
    id: "threat-ticker",
    name: "Threat Ticker",
    description: "Scrolling bar of latest intelligence events with severity colors",
    size: '100% × 48px',
    preview: "bg-hud-base border-hud-accent/30",
  },
  {
    id: "event-feed",
    name: "Event Feed",
    description: "Live feed of global intelligence events with category filters",
    size: '400px × 600px',
    preview: "bg-hud-base border-hud-accent/30",
  },
  {
    id: "threat-level",
    name: "Global Threat Level",
    description: "Current global threat index gauge with trend indicator",
    size: '300px × 200px',
    preview: "bg-hud-base border-hud-accent/30",
  },
  {
    id: "country-risk",
    name: "Country Risk Card",
    description: "Risk score and recent events for a specific country",
    size: '350px × 250px',
    preview: "bg-hud-base border-hud-accent/30",
  },
] as const;

function EmbedCodeBlock({ type, country }: { type: string; country?: string }) {
  const baseUrl = "https://troiamedia.com/api/widget";
  const params = country ? `?type=${type}&country=${country}` : `?type=${type}`;
  const width = type === "threat-ticker" ? "100%" : type === "event-feed" ? "400" : type === "country-risk" ? "350" : "300";
  const height = type === "threat-ticker" ? "48" : type === "event-feed" ? "600" : type === "country-risk" ? "250" : "200";

  return (
    <pre className="bg-hud-base border border-hud-border rounded p-3 font-mono text-[10px] text-hud-muted overflow-x-auto">
      <code>{`<iframe
  src="${baseUrl}${params}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: 1px solid #1a2332; border-radius: 8px;"
  loading="lazy"
  title="WorldScope ${type} Widget"
></iframe>`}</code>
    </pre>
  );
}

export default function EmbedPage() {
  return (
    <main className="min-h-screen bg-hud-base text-hud-text">
      {/* Hero */}
      <section className="border-b border-hud-border bg-hud-panel/50 px-6 py-12 text-center">
        <div className="font-mono text-[10px] text-hud-accent tracking-widest uppercase mb-2">
          DEVELOPER TOOLS
        </div>
        <h1 className="font-mono text-2xl font-bold text-hud-text">
          Embed WorldScope Widgets
        </h1>
        <p className="mt-2 text-sm text-hud-muted max-w-xl mx-auto">
          Add real-time global intelligence to your website, blog, or dashboard.
          Free, no API key required. Just copy and paste.
        </p>
      </section>

      {/* Widget catalog */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="space-y-10">
          {WIDGET_TYPES.map((widget) => (
            <div
              key={widget.id}
              className="border border-hud-border rounded-lg overflow-hidden"
            >
              {/* Widget header */}
              <div className="bg-hud-panel/60 px-5 py-4 border-b border-hud-border">
                <h2 className="font-mono text-sm font-semibold text-hud-text">
                  {widget.name}
                </h2>
                <p className="font-mono text-[10px] text-hud-muted mt-1">
                  {widget.description}
                </p>
                <div className="font-mono text-[9px] text-hud-accent mt-1">
                  Size: {widget.size}
                </div>
              </div>

              {/* Embed code */}
              <div className="px-5 py-4">
                <div className="font-mono text-[9px] text-hud-muted uppercase tracking-wider mb-2">
                  Embed Code
                </div>
                <EmbedCodeBlock type={widget.id} />
                {widget.id === "country-risk" && (
                  <div className="mt-3">
                    <div className="font-mono text-[9px] text-hud-muted uppercase tracking-wider mb-2">
                      With Country Parameter
                    </div>
                    <EmbedCodeBlock type={widget.id} country="US" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* API link */}
        <div className="mt-12 text-center border-t border-hud-border pt-8">
          <p className="font-mono text-xs text-hud-muted mb-3">
            Need more control? Use the WorldScope API directly.
          </p>
          <Link
            href="/api-docs"
            className="px-5 py-2 bg-hud-accent/20 border border-hud-accent/50 rounded font-mono text-xs text-hud-accent hover:bg-hud-accent/30 transition-colors"
          >
            View API Documentation
          </Link>
        </div>

        {/* Back */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="font-mono text-[10px] text-hud-accent hover:underline"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </section>

      {/* SEO */}
      <section className="sr-only">
        <h2>WorldScope Embeddable Intelligence Widgets</h2>
        <p>
          Free embeddable widgets for real-time global intelligence monitoring.
          Add threat tickers, event feeds, threat level gauges, and country risk
          cards to your website with a simple iframe embed code. No API key
          required. Powered by 570+ verified intelligence sources.
        </p>
      </section>
    </main>
  );
}
