import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES, COUNTRY_MAP } from "@/config/countries";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { Category, Severity } from "@/types/intel";
import { createServerClient } from "@/lib/db/supabase";
import Link from "next/link";
import { AdSenseUnit, CarbonAd, AffiliateBanner, AdConsentBanner } from "@/components/ads";

/* ── Static params for all country pages ── */
export async function generateStaticParams() {
  return COUNTRIES.map((c) => ({ code: c.code.toLowerCase() }));
}

// Force dynamic rendering — Supabase queries need runtime env vars
export const dynamic = "force-dynamic";

/* ── Dynamic metadata per country ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  if (!country) return { title: "Country Not Found — WorldScope" };

  const title = `${country.name} Intelligence Report — WorldScope`;
  const description = `Real-time intelligence monitoring for ${country.name}. Latest events, threat analysis, and security updates.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

/* ── Fetch country events from Supabase ── */
async function fetchCountryEvents(countryCode: string) {
  const db = createServerClient();

  // Fetch events with matching country_code, last 72 hours
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("events")
    .select("*")
    .eq("country_code", countryCode.toUpperCase())
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data || [];
}

/* ── Severity badge component ── */
function SeverityBadge({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity] || "#5a7a9a";
  return (
    <span
      className="font-mono text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded border"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
    >
      {severity.toUpperCase()}
    </span>
  );
}

/* ── Main page component ── */
export default async function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  if (!country) notFound();

  const events = await fetchCountryEvents(code);

  // Compute stats
  const sevCounts: Record<string, number> = {};
  const catCounts: Record<string, number> = {};
  events.forEach((e: { severity?: string; category?: string }) => {
    if (e.severity) sevCounts[e.severity] = (sevCounts[e.severity] || 0) + 1;
    if (e.category) catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  });

  const topCategories = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      {/* Header */}
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-[10px] font-mono text-hud-muted mb-4">
            <Link href="/" className="text-hud-accent hover:underline">WORLDSCOPE</Link>
            <span>/</span>
            <span>{country.region.toUpperCase()}</span>
            <span>/</span>
            <span className="text-hud-text">{country.code}</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-4xl">{getFlagEmoji(country.code)}</div>
            <div>
              <h1 className="font-mono text-2xl font-bold text-hud-text tracking-wide">
                {country.name}
              </h1>
              <p className="font-mono text-xs text-hud-muted mt-1">
                {country.nameTr} • {country.region} • {events.length} events (72h)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Top ad placement */}
        <div className="mb-6">
          <AdSenseUnit slot="1234567890" format="horizontal" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Severity distribution */}
            <div className="bg-hud-surface border border-hud-border rounded-md p-4">
              <h2 className="font-mono text-[10px] font-bold text-hud-accent tracking-wider mb-3">
                THREAT LEVEL
              </h2>
              {(["critical", "high", "medium", "low", "info"] as Severity[]).map((sev) => {
                const count = sevCounts[sev] || 0;
                const pct = events.length > 0 ? (count / events.length) * 100 : 0;
                return (
                  <div key={sev} className="flex items-center gap-2 mb-2">
                    <span
                      className="font-mono text-[9px] w-16 text-right"
                      style={{ color: SEVERITY_COLORS[sev] }}
                    >
                      {sev.toUpperCase()}
                    </span>
                    <div className="flex-1 h-2 bg-hud-panel rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: SEVERITY_COLORS[sev],
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-hud-muted w-6 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Top categories */}
            <div className="bg-hud-surface border border-hud-border rounded-md p-4">
              <h2 className="font-mono text-[10px] font-bold text-hud-accent tracking-wider mb-3">
                TOP CATEGORIES
              </h2>
              {topCategories.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between py-1.5 border-b border-hud-border last:border-0">
                  <span className="text-xs text-hud-text">
                    {CATEGORY_ICONS[cat as Category] || "📌"} {cat}
                  </span>
                  <span className="font-mono text-[10px] text-hud-muted">{count}</span>
                </div>
              ))}
              {topCategories.length === 0 && (
                <p className="text-[10px] text-hud-muted">No events recorded</p>
              )}
            </div>

            {/* Coordinates */}
            <div className="bg-hud-surface border border-hud-border rounded-md p-4">
              <h2 className="font-mono text-[10px] font-bold text-hud-accent tracking-wider mb-3">
                GEO DATA
              </h2>
              <div className="font-mono text-[10px] text-hud-muted space-y-1">
                <p>LAT: {country.lat.toFixed(2)}°</p>
                <p>LNG: {country.lng.toFixed(2)}°</p>
                <p>REGION: {country.region}</p>
              </div>
            </div>

            {/* Carbon Ad in sidebar */}
            <CarbonAd />
          </div>

          {/* Events feed */}
          <div className="lg:col-span-2">
            <h2 className="font-mono text-[10px] font-bold text-hud-accent tracking-wider mb-4">
              RECENT INTELLIGENCE — {events.length} EVENTS
            </h2>

            {events.length === 0 ? (
              <div className="bg-hud-surface border border-hud-border rounded-md p-8 text-center">
                <p className="font-mono text-sm text-hud-muted">
                  No intelligence events for {country.name} in the last 72 hours.
                </p>
                <Link
                  href="/"
                  className="inline-block mt-4 font-mono text-xs text-hud-accent hover:underline"
                >
                  ← Return to Dashboard
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event: {
                  id: string;
                  title: string;
                  summary?: string;
                  severity: Severity;
                  category: Category;
                  source?: string;
                  url?: string;
                  published_at?: string;
                }) => (
                  <article
                    key={event.id}
                    className="bg-hud-surface border border-hud-border rounded-md p-4 hover:border-hud-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg mt-0.5">
                        {CATEGORY_ICONS[event.category] || "📌"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge severity={event.severity} />
                          <span className="font-mono text-[8px] text-hud-muted uppercase">
                            {event.category}
                          </span>
                          {event.published_at && (
                            <span className="font-mono text-[8px] text-hud-muted ml-auto">
                              {new Date(event.published_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm text-hud-text leading-snug mb-1">
                          {event.url ? (
                            <a
                              href={event.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-hud-accent transition-colors"
                            >
                              {event.title}
                            </a>
                          ) : (
                            event.title
                          )}
                        </h3>

                        {event.summary && (
                          <p className="text-[11px] text-hud-muted leading-relaxed line-clamp-2">
                            {event.summary}
                          </p>
                        )}

                        {event.source && (
                          <p className="font-mono text-[8px] text-hud-muted mt-1.5">
                            SOURCE: {event.source}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Country directory */}
        <section className="mt-12 border-t border-hud-border pt-8">
          <h2 className="font-mono text-[10px] font-bold text-hud-accent tracking-wider mb-4">
            ALL MONITORED COUNTRIES
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {COUNTRIES.map((c) => (
              <Link
                key={c.code}
                href={`/country/${c.code.toLowerCase()}`}
                className={`font-mono text-[10px] px-2 py-1.5 rounded border transition-colors ${
                  c.code === country.code
                    ? "bg-hud-accent/10 border-hud-accent/30 text-hud-accent"
                    : "bg-hud-surface border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-muted"
                }`}
              >
                {getFlagEmoji(c.code)} {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom affiliate banner */}
        <div className="mt-8">
          <AffiliateBanner />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hud-border bg-hud-surface mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="font-mono text-[9px] text-hud-muted">
            WorldScope — Global Intelligence Dashboard • Updated every 60 seconds
          </p>
          <Link href="/" className="font-mono text-[10px] text-hud-accent hover:underline mt-2 inline-block">
            ← Back to Live Dashboard
          </Link>
        </div>
      </footer>

      {/* GDPR Consent Banner */}
      <AdConsentBanner />
    </div>
  );
}

/** Convert ISO country code to flag emoji */
function getFlagEmoji(code: string): string {
  const offset = 127397;
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join("");
}
