import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Embed an Interactive Globe — WorldScope Live Events Map",
  description:
    "Drop a live, interactive globe with real-time global intelligence events into any website. Free, no API key, attribution backlink to WorldScope.",
  alternates: { canonical: "https://troiamedia.com/embed/globe" },
  openGraph: {
    title: "Embed WorldScope Live Globe",
    description:
      "Free embeddable interactive globe showing real-time conflict, cyber, finance, weather and health events from 689 sources worldwide.",
    type: "website",
  },
};

const SIZES = [
  { id: "compact", label: "Compact (badge)", w: 320, h: 320 },
  { id: "medium", label: "Medium (article)", w: 640, h: 480 },
  { id: "large", label: "Large (hero)", w: 960, h: 600 },
  { id: "responsive", label: "Responsive (full-width)", w: "100%", h: 600 },
] as const;

const VARIANTS = [
  { id: "all", label: "All signals" },
  { id: "conflict", label: "Conflict" },
  { id: "cyber", label: "Cyber threats" },
  { id: "finance", label: "Finance / markets" },
  { id: "weather", label: "Weather / disasters" },
  { id: "health", label: "Health / outbreaks" },
  { id: "energy", label: "Energy" },
] as const;

function buildEmbed(
  variant: string,
  size: { w: number | string; h: number },
): string {
  const src = `https://troiamedia.com/embed/globe/widget?variant=${variant}`;
  const w = typeof size.w === "number" ? size.w : "100%";
  return `<iframe
  src="${src}"
  width="${w}"
  height="${size.h}"
  frameborder="0"
  loading="lazy"
  allow="fullscreen"
  style="border:1px solid #1a2540;border-radius:12px;max-width:100%;"
  title="WorldScope Live Intelligence Globe"
></iframe>
<p style="font-size:11px;color:#6b7280;margin-top:6px;">
  Live data from <a href="https://troiamedia.com" rel="noopener" target="_blank">WorldScope at TroiaMedia</a> — 689 sources, 195 countries.
</p>`;
}

export default function GlobeEmbedPage() {
  return (
    <main className="min-h-screen bg-hud-base text-hud-text overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="font-mono text-[10px] text-hud-accent uppercase tracking-[0.2em] mb-2">
          DEVELOPER TOOLS · FREE
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
          Embed a Live Globe
        </h1>
        <p className="font-mono text-xs md:text-sm text-hud-muted max-w-2xl mb-8 leading-relaxed">
          Drop an interactive 3D globe with real-time intelligence pins onto
          any website, blog or dashboard. Free forever, no API key, no
          tracking. Attribution backlink to WorldScope is included by default
          and helps keep the project free.
        </p>

        {/* Live preview */}
        <div className="border border-hud-border rounded-xl overflow-hidden mb-12 bg-hud-panel/40">
          <div className="px-4 py-3 border-b border-hud-border font-mono text-[10px] text-hud-muted uppercase tracking-wider">
            LIVE PREVIEW
          </div>
          <div className="aspect-[16/9] flex items-center justify-center text-hud-muted font-mono text-xs">
            [interactive globe iframe loads here at runtime]
          </div>
        </div>

        {/* Build your embed */}
        <h2 className="font-display text-2xl font-bold mb-4">
          Build your embed
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div>
            <div className="font-mono text-[10px] text-hud-muted uppercase tracking-wider mb-2">
              SIZE
            </div>
            <ul className="space-y-2">
              {SIZES.map((s) => (
                <li
                  key={s.id}
                  className="font-mono text-xs text-hud-text border border-hud-border/50 rounded px-3 py-2 bg-hud-panel/40"
                >
                  {s.label}{" "}
                  <span className="text-hud-muted">
                    — {s.w} × {s.h}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] text-hud-muted uppercase tracking-wider mb-2">
              VARIANT
            </div>
            <ul className="space-y-2">
              {VARIANTS.map((v) => (
                <li
                  key={v.id}
                  className="font-mono text-xs text-hud-text border border-hud-border/50 rounded px-3 py-2 bg-hud-panel/40"
                >
                  {v.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Snippets */}
        <h2 className="font-display text-2xl font-bold mb-4">Code snippets</h2>
        <div className="space-y-6">
          {SIZES.map((size) => (
            <div key={size.id}>
              <div className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-2">
                {size.label}
              </div>
              <pre className="bg-hud-base border border-hud-border rounded-lg p-4 font-mono text-[10px] text-hud-muted overflow-x-auto whitespace-pre">
                {buildEmbed("all", size)}
              </pre>
            </div>
          ))}
        </div>

        {/* Terms */}
        <div className="mt-12 border-t border-hud-border/50 pt-8">
          <h3 className="font-display text-lg font-bold mb-3">Terms of use</h3>
          <ul className="font-mono text-xs text-hud-muted space-y-2 leading-relaxed">
            <li>• Free for any non-commercial or commercial site.</li>
            <li>
              • Keep the &quot;Powered by WorldScope&quot; attribution link
              visible. Removing it is a license violation.
            </li>
            <li>• No SLA — best effort. We may rate-limit abusive embeds.</li>
            <li>
              • Data is provided as-is for informational use. See our{" "}
              <Link
                href="/disclaimer"
                className="text-hud-accent underline"
              >
                disclaimer
              </Link>
              .
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/embed"
            className="font-mono text-[11px] text-hud-accent border border-hud-accent/40 px-4 py-2 rounded hover:bg-hud-accent/10 transition-colors"
          >
            ← BACK TO ALL WIDGETS
          </Link>
        </div>
      </div>
    </main>
  );
}
