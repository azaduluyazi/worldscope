import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COUNTRIES, COUNTRY_MAP } from "@/config/countries";
import {
  VARIANT_SEO_META,
  SEO_VARIANT_IDS,
  getVariantSeoMeta,
} from "@/config/variants";
import { createServerClient } from "@/lib/db/supabase";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";
import { AD_PLACEMENTS } from "@/config/ads";
import {
  NewsArticleSchema,
  BreadcrumbSchema,
  DatasetSchema,
  SpeakableSchema,
} from "@/components/seo/StructuredData";

/**
 * /country/[code]/[variant] — Programmatic SEO pages.
 *
 * 198 countries × 9 SEO variants = up to 1,782 statically-generated
 * pages, each combining country context with a variant-specific
 * event stream.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

export const revalidate = 3600;

export async function generateStaticParams() {
  const params: Array<{ code: string; variant: string }> = [];
  for (const country of COUNTRIES) {
    for (const variant of SEO_VARIANT_IDS) {
      params.push({
        code: country.code.toLowerCase(),
        variant,
      });
    }
  }
  return params;
}

interface Params {
  code: string;
  variant: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { code, variant } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  const meta = getVariantSeoMeta(variant);

  if (!country || !meta) {
    return { title: "Not Found", robots: { index: false, follow: false } };
  }

  const year = new Date().getFullYear();
  const title = `${country.name} ${meta.label} — ${year}`;
  const description = `Real-time ${meta.label.toLowerCase()} for ${country.name}. ${meta.tagline} — aggregated from 689 verified sources. Live event feed, AI-curated convergence stories, and ${country.region} regional context. Free, no signup.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/country/${code.toLowerCase()}/${variant}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/country/${code.toLowerCase()}/${variant}`,
      siteName: "TroiaMedia",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords: [
      `${country.name} ${meta.label.toLowerCase()}`,
      `${country.name} ${variant}`,
      `${country.nameTr} ${meta.labelTr.toLowerCase()}`,
      `${country.region} ${variant}`,
      "OSINT",
      "real-time intelligence",
    ],
  };
}

interface EventLite {
  id: string;
  title: string | null;
  severity: string | null;
  published_at: string | null;
  source: string | null;
}

async function getRecentEvents(
  countryCode: string,
  category: string,
): Promise<EventLite[]> {
  try {
    const db = createServerClient();
    const { data } = await db
      .from("events")
      .select("id, title, severity, published_at, source")
      .eq("country_code", countryCode.toUpperCase())
      .eq("category", category)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(20);
    return (data as EventLite[]) || [];
  } catch {
    return [];
  }
}

async function getEventCount(
  countryCode: string,
  category: string,
): Promise<number> {
  try {
    const db = createServerClient();
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 86_400_000,
    ).toISOString();
    const { count } = await db
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("country_code", countryCode.toUpperCase())
      .eq("category", category)
      .gte("published_at", thirtyDaysAgo);
    return count ?? 0;
  } catch {
    return 0;
  }
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
  info: "#8a5cf6",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export default async function CountryVariantPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { code, variant } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  const meta = getVariantSeoMeta(variant);

  if (!country || !meta) notFound();

  const [events, count30d] = await Promise.all([
    getRecentEvents(country.code, meta.eventCategory),
    getEventCount(country.code, meta.eventCategory),
  ]);

  const canonical = `${SITE_URL}/country/${code.toLowerCase()}/${variant}`;
  const now = new Date().toISOString();

  const neighbors = COUNTRIES.filter(
    (c) => c.region === country.region && c.code !== country.code,
  ).slice(0, 6);

  const siblingVariants = Object.values(VARIANT_SEO_META).filter(
    (v) => v.id !== meta.id,
  );

  const labelUpper = meta.label.toLocaleUpperCase("en-US");

  return (
    <>
      <NewsArticleSchema
        headline={`${country.name} ${meta.label} — ${new Date().getFullYear()}`}
        description={`Live ${meta.label.toLowerCase()} dashboard for ${country.name}. ${meta.tagline}.`}
        url={canonical}
        datePublished={now}
        dateModified={now}
        section={meta.label}
        keywords={[
          `${country.name} ${variant}`,
          country.region,
          meta.label,
          "OSINT",
          "real-time",
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: SITE_URL },
          {
            name: country.name,
            url: `${SITE_URL}/country/${code.toLowerCase()}`,
          },
          { name: meta.label, url: canonical },
        ]}
      />
      <DatasetSchema
        name={`${country.name} ${meta.label} Live Dataset`}
        description={`Real-time ${meta.label.toLowerCase()} events for ${country.name}, aggregated from 689 verified OSINT sources. Updated continuously.`}
        url={canonical}
        keywords={[meta.label, country.name, country.region, "OSINT", "real-time"]}
        spatialCoverage={country.name}
        datePublished={now}
      />
      <SpeakableSchema cssSelectors={["h1", ".variant-summary"]} />

      <main className="min-h-screen bg-hud-base text-hud-text overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <div className="font-mono text-[10px] text-hud-muted mb-3">
            <Link href="/" className="hover:text-hud-accent">
              Home
            </Link>
            {" / "}
            <Link
              href={`/country/${code.toLowerCase()}`}
              className="hover:text-hud-accent"
            >
              {country.name}
            </Link>
            {" / "}
            <span className="text-hud-accent">{meta.label}</span>
          </div>

          {/* Hero */}
          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2 text-hud-accent">
              {meta.emoji} {meta.label}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-3">
              {country.name} {meta.label}
              <span className="text-hud-muted text-2xl md:text-3xl font-normal">
                {" "}
                · {new Date().getFullYear()}
              </span>
            </h1>
            <p className="variant-summary font-mono text-sm text-hud-muted leading-relaxed max-w-2xl">
              {meta.tagline} for{" "}
              <strong className="text-hud-text">{country.name}</strong> (
              {country.region}). Aggregated from 689 verified OSINT sources,
              updated continuously.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard label="EVENTS (30D)" value={count30d.toString()} />
            <StatCard label="COUNTRY" value={country.code} />
            <StatCard label="REGION" value={country.region} />
            <StatCard label="UPDATED" value="LIVE" />
          </div>

          {/* Live event feed */}
          <section className="mb-10">
            <h2
              className="font-mono text-[10px] text-hud-accent tracking-wider mb-3"
              lang="en"
            >
              LATEST {labelUpper} EVENTS
            </h2>
            {events.length === 0 ? (
              <div className="border border-hud-border/40 rounded px-4 py-6 bg-hud-panel/30 text-center">
                <div className="font-mono text-xs text-hud-muted">
                  No {variant} events reported for {country.name} in the last
                  30 days. Check back soon or browse the{" "}
                  <Link
                    href={`/country/${code.toLowerCase()}`}
                    className="text-hud-accent underline"
                  >
                    full {country.name} dashboard
                  </Link>
                  .
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="border border-hud-border/40 rounded bg-hud-panel/30 hover:border-hud-accent/30 transition-colors"
                  >
                    <Link href={`/events/${e.id}`} className="block px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full"
                          style={{
                            backgroundColor:
                              SEVERITY_COLOR[e.severity || "info"] ||
                              SEVERITY_COLOR.info,
                          }}
                          aria-label={e.severity || "info"}
                        />
                        <span className="flex-1 font-mono text-xs text-hud-text">
                          {e.title}
                        </span>
                        <span className="flex-shrink-0 font-mono text-[9px] text-hud-muted whitespace-nowrap">
                          {formatDate(e.published_at)}
                        </span>
                      </div>
                      {e.source && (
                        <div className="font-mono text-[9px] text-hud-muted/70 mt-1 ml-4">
                          via {e.source}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* AdSense variant placement */}
          {AD_PLACEMENTS.variant
            .filter((p) => p.enabled && p.slot)
            .map((p) => (
              <div key={p.id} className="my-8">
                <AdSenseUnit
                  slot={p.slot!}
                  format={p.format as "horizontal" | "rectangle" | "vertical" | "auto"}
                />
              </div>
            ))}

          {/* Inline briefing CTA */}
          <aside className="mb-10 border border-hud-accent/30 rounded-lg p-5 bg-gradient-to-br from-hud-panel/60 to-hud-panel/20">
            <div className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-2">
              ⚡ WEEKLY BRIEFING
            </div>
            <h3 className="font-display text-lg font-bold mb-2">
              {country.name} &amp; {meta.label} — convergent signals, every
              Sunday
            </h3>
            <p className="font-mono text-xs text-hud-muted mb-3 leading-relaxed">
              Get the Sunday Convergence Report — AI-curated from 689 sources.
              Free, no spam, unsubscribe in one click.
            </p>
            <Link
              href="/briefing"
              lang="en"
              className="inline-block font-mono text-[11px] text-hud-base bg-hud-accent px-4 py-2 rounded hover:bg-hud-accent/80"
            >
              SUBSCRIBE FREE →
            </Link>
          </aside>

          {/* Sibling variants */}
          <section className="mb-8">
            <h2
              className="font-mono text-[10px] text-hud-accent tracking-wider mb-3"
              lang="en"
            >
              MORE {country.name.toLocaleUpperCase("en-US")} DASHBOARDS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {siblingVariants.map((v) => (
                <Link
                  key={v.id}
                  href={`/country/${code.toLowerCase()}/${v.id}`}
                  className="font-mono text-[11px] text-hud-text border border-hud-border/40 rounded px-3 py-2 hover:border-hud-accent/50"
                >
                  {v.emoji} {v.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Neighbor countries */}
          {neighbors.length > 0 && (
            <section className="mb-8">
              <h2
                className="font-mono text-[10px] text-hud-accent tracking-wider mb-3"
                lang="en"
              >
                REGIONAL · {country.region.toLocaleUpperCase("en-US")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {neighbors.map((n) => (
                  <Link
                    key={n.code}
                    href={`/country/${n.code.toLowerCase()}/${variant}`}
                    className="font-mono text-[10px] text-hud-muted border border-hud-border/40 px-3 py-1.5 rounded hover:text-hud-accent hover:border-hud-accent/40"
                  >
                    {n.name} · {meta.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Footer trust */}
          <div className="border-t border-hud-border/40 pt-6 text-center font-mono text-[9px] text-hud-muted/70">
            <Link href="/editorial-policy" className="underline">
              Editorial policy
            </Link>{" "}
            ·{" "}
            <Link href="/ownership" className="underline">
              Ownership
            </Link>{" "}
            ·{" "}
            <Link href="/corrections" className="underline">
              Corrections
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hud-border/40 rounded p-3 bg-hud-panel/30">
      <div className="font-mono text-[9px] text-hud-muted uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="font-mono text-sm text-hud-text font-bold">{value}</div>
    </div>
  );
}
