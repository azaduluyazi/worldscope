import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Intelligence Podcast — WorldScope",
  description:
    "Listen to AI-generated daily intelligence briefings. Global events, threat assessments, and geopolitical analysis in audio format. Subscribe via Apple Podcasts or Spotify.",
  keywords: [
    "intelligence podcast",
    "OSINT podcast",
    "daily briefing audio",
    "AI news podcast",
    "geopolitical podcast",
    "threat assessment audio",
    "WorldScope podcast",
    "istihbarat podcast",
  ],
  openGraph: {
    title: "Intelligence Podcast — WorldScope",
    description:
      "AI-generated daily intelligence briefings in audio format.",
    type: "website",
  },
  alternates: {
    canonical: "https://troiamedia.com/podcast",
    types: { "application/rss+xml": "/podcast.xml" },
  },
};

export default function PodcastPage() {
  return (
    <main className="min-h-screen bg-hud-base text-hud-text">
      {/* Hero */}
      <section className="border-b border-hud-border bg-hud-panel/50 px-6 py-16 text-center">
        <div className="text-4xl mb-3">🎙</div>
        <h1 className="font-mono text-2xl font-bold text-hud-accent tracking-wider">
          INTELLIGENCE PODCAST
        </h1>
        <p className="mt-3 text-sm text-hud-muted max-w-xl mx-auto">
          AI-generated daily intelligence briefings from 570+ verified sources.
          Listen to threat assessments, conflict updates, and geopolitical
          analysis — updated every day.
        </p>
      </section>

      {/* Player section */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        {/* Today's episode */}
        <div className="border border-hud-border rounded-lg overflow-hidden mb-8">
          <div className="bg-hud-panel/60 px-5 py-4 border-b border-hud-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-hud-accent/20 flex items-center justify-center text-2xl flex-shrink-0">
                🎙
              </div>
              <div>
                <h2 className="font-mono text-sm font-semibold text-hud-text">
                  Today&apos;s Intelligence Briefing
                </h2>
                <p className="font-mono text-[10px] text-hud-muted mt-0.5">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            {/* Direct audio player */}
            <audio
              controls
              preload="none"
              className="w-full"
              src="/api/podcast/generate"
            >
              Your browser does not support the audio element.
            </audio>

            <div className="flex items-center gap-3 mt-3">
              <a
                href="/api/podcast/generate"
                download={`worldscope-briefing-${new Date().toISOString().split("T")[0]}.mp3`}
                className="font-mono text-[9px] px-3 py-1.5 rounded border border-hud-border text-hud-muted hover:text-hud-accent hover:border-hud-accent/50 transition-colors"
              >
                ⬇ Download MP3
              </a>
              <a
                href="/api/podcast/generate?format=text"
                className="font-mono text-[9px] px-3 py-1.5 rounded border border-hud-border text-hud-muted hover:text-hud-accent hover:border-hud-accent/50 transition-colors"
              >
                📝 Read Script
              </a>
            </div>
          </div>
        </div>

        {/* Subscribe section */}
        <div className="border border-hud-border rounded-lg p-5 mb-8">
          <h2 className="font-mono text-xs font-bold text-hud-accent tracking-wider mb-3">
            SUBSCRIBE
          </h2>
          <p className="font-mono text-[10px] text-hud-muted mb-4">
            Get the daily intelligence briefing automatically delivered to your
            podcast app.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="/podcast.xml"
              className="font-mono text-[9px] px-3 py-1.5 rounded bg-hud-accent/20 border border-hud-accent/50 text-hud-accent hover:bg-hud-accent/30 transition-colors"
            >
              📡 RSS Feed
            </a>
            <span className="font-mono text-[9px] px-3 py-1.5 rounded border border-hud-border text-hud-muted">
              Apple Podcasts (coming soon)
            </span>
            <span className="font-mono text-[9px] px-3 py-1.5 rounded border border-hud-border text-hud-muted">
              Spotify (coming soon)
            </span>
          </div>
        </div>

        {/* About */}
        <div className="text-center">
          <p className="font-mono text-[10px] text-hud-muted mb-3">
            Powered by WorldScope AI — 570+ sources, 195 countries, 30 languages
          </p>
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
        <h2>WorldScope Intelligence Podcast</h2>
        <p>
          Daily AI-generated intelligence briefings covering global conflicts,
          cybersecurity threats, financial markets, energy geopolitics, and
          country-specific risk assessments. Listen to professional-grade
          intelligence analysis from 570+ verified sources across 195 countries.
        </p>
      </section>
    </main>
  );
}
