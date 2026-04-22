import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/db/supabase";
import {
  NewsArticleSchema,
  BreadcrumbSchema,
  EventSchema,
  SpeakableSchema,
} from "@/components/seo/StructuredData";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";
import { AD_PLACEMENTS } from "@/config/ads";

// Skip build prerender — same pattern as /country and /blog. Supabase
// lookup for a specific event id can exceed the 60s build worker
// limit; render on request with the same 30-min ISR window.
export const dynamic = "force-dynamic";
export const revalidate = 1800;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

interface EventRow {
  id: string;
  source: string | null;
  category: string | null;
  severity: string | null;
  title: string | null;
  summary: string | null;
  url: string | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  country_code: string | null;
  published_at: string | null;
  fetched_at: string | null;
}

interface ConvergenceLink {
  storyline_id: string;
  storyline_headline: string;
  peak_confidence: number;
  categories: string[] | null;
  affected_regions: string[] | null;
}

async function getEvent(id: string): Promise<EventRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const db = createServerClient();
    const { data } = await db
      .from("events")
      .select(
        "id, source, category, severity, title, summary, url, image_url, lat, lng, country_code, published_at, fetched_at",
      )
      .eq("id", id)
      .maybeSingle();
    return data as EventRow | null;
  } catch {
    return null;
  }
}

async function getConvergence(
  eventId: string,
): Promise<ConvergenceLink | null> {
  // Hard 1.5s timeout — `event_convergence_scores` is a materialized
  // view that can be empty immediately after schema changes, and we'd
  // rather render the page without the convergence badge than block
  // the user behind a slow/incomplete materialisation.
  try {
    const db = createServerClient();
    const query = db
      .from("event_convergence_scores")
      .select(
        "storyline_id, storyline_headline, peak_confidence, categories, affected_regions",
      )
      .eq("event_id", eventId)
      .maybeSingle();

    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 1500),
    );
    const result = await Promise.race([query, timeout]);
    if (!result || "then" in result) return null;
    // result is the Supabase response object
    const data = (result as { data?: ConvergenceLink | null }).data;
    return data ?? null;
  } catch (err) {
    console.error("[events/[id] getConvergence]", err);
    return null;
  }
}

async function getRelated(
  event: EventRow,
  limit = 6,
): Promise<Array<Pick<EventRow, "id" | "title" | "category" | "published_at">>> {
  try {
    const db = createServerClient();
    let query = db
      .from("events")
      .select("id, title, category, published_at")
      .neq("id", event.id)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (event.country_code) {
      query = query.eq("country_code", event.country_code);
    } else if (event.category) {
      query = query.eq("category", event.category);
    }

    const { data } = await query;
    return (data as Array<Pick<EventRow, "id" | "title" | "category" | "published_at">>) || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event || !event.title) {
    return {
      title: "Event not found",
      robots: { index: false, follow: false },
    };
  }

  const title = event.title.slice(0, 70);
  const description =
    event.summary?.slice(0, 160) ||
    `${event.category || "Intelligence"} event tracked by WorldScope${event.country_code ? ` · ${event.country_code}` : ""}.`;

  return {
    title: `${title} | TroiaMedia`,
    description,
    alternates: { canonical: `${SITE_URL}/events/${id}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/events/${id}`,
      publishedTime: event.published_at || undefined,
      siteName: "TroiaMedia",
      ...(event.image_url && { images: [event.image_url] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(event.image_url && { images: [event.image_url] }),
    },
    robots: { index: true, follow: true },
  };
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
  info: "#8a5cf6",
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event || !event.title) notFound();

  const [related, convergence] = await Promise.all([
    getRelated(event),
    getConvergence(event.id),
  ]);
  const url = `${SITE_URL}/events/${id}`;
  const severityColor =
    SEVERITY_COLOR[event.severity || "info"] || SEVERITY_COLOR.info;
  const publishedAt = event.published_at || event.fetched_at || new Date().toISOString();

  return (
    <>
      <NewsArticleSchema
        headline={event.title}
        description={event.summary || event.title}
        url={url}
        datePublished={publishedAt}
        dateModified={event.fetched_at || publishedAt}
        image={event.image_url || undefined}
        section={event.category || "Intelligence"}
        keywords={[
          event.category || "intelligence",
          event.country_code || "global",
          event.severity || "info",
          "OSINT",
          "real-time",
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: SITE_URL },
          {
            name: event.category || "Events",
            url: `${SITE_URL}/${event.category || ""}`,
          },
          { name: event.title.slice(0, 60), url },
        ]}
      />
      <EventSchema
        name={event.title}
        description={event.summary || event.title}
        startDate={publishedAt}
        url={url}
        eventStatus="active"
        location={
          event.country_code
            ? {
                name: event.country_code,
                lat: event.lat || undefined,
                lon: event.lng || undefined,
              }
            : undefined
        }
      />
      <SpeakableSchema cssSelectors={["h1", ".event-summary"]} />

      <main className="min-h-screen bg-hud-base text-hud-text overflow-y-auto">
        <article className="max-w-3xl mx-auto px-4 py-10">
          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider mb-4">
            <Link
              href={`/${event.category || ""}`}
              className="text-hud-accent border border-hud-accent/30 px-2 py-0.5 rounded hover:bg-hud-accent/10"
            >
              {event.category || "EVENT"}
            </Link>
            <span
              lang="en"
              className="border px-2 py-0.5 rounded normal-case"
              style={{
                color: severityColor,
                borderColor: `${severityColor}55`,
                backgroundColor: `${severityColor}11`,
              }}
            >
              {(event.severity || "info").toLocaleUpperCase("en-US")}
            </span>
            {event.country_code && (
              <Link
                href={`/country/${event.country_code.toLowerCase()}`}
                className="text-hud-muted border border-hud-border/50 px-2 py-0.5 rounded hover:border-hud-accent/30"
              >
                {event.country_code}
              </Link>
            )}
            <span className="text-hud-muted/70">
              {formatTimestamp(publishedAt)}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-2xl md:text-4xl font-bold mb-4 leading-tight">
            {event.title}
          </h1>

          {/* Hero image */}
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full max-h-96 object-cover rounded-lg border border-hud-border/50 mb-6"
              loading="eager"
            />
          )}

          {/* Summary */}
          {event.summary && (
            <p className="event-summary font-mono text-sm md:text-base text-hud-muted leading-relaxed mb-6">
              {event.summary}
            </p>
          )}

          {/* Convergence badge — shown only when this event is linked to a storyline */}
          {convergence && (
            <aside className="mb-6 border border-hud-accent/40 rounded-lg p-4 bg-gradient-to-br from-hud-panel/60 to-hud-panel/20">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-hud-accent uppercase tracking-[0.15em] mb-1.5">
                    <span>◆ CONVERGENT STORYLINE</span>
                    <span className="text-hud-muted">
                      {Math.round(Number(convergence.peak_confidence) * 100)}%
                      CONFIDENCE
                    </span>
                  </div>
                  <div className="font-mono text-xs md:text-sm text-hud-text leading-relaxed mb-2">
                    {convergence.storyline_headline.slice(0, 240)}
                    {convergence.storyline_headline.length > 240 && "…"}
                  </div>
                  {convergence.categories && convergence.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                      {convergence.categories.slice(0, 5).map((c) => (
                        <span
                          key={c}
                          className="text-hud-accent border border-hud-accent/30 px-1.5 py-0.5 rounded uppercase tracking-wider"
                          lang="en"
                        >
                          {c.toLocaleUpperCase("en-US")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Confidence meter */}
                <div className="flex flex-col items-end gap-1">
                  <div className="w-24 h-2 bg-hud-panel rounded overflow-hidden border border-hud-border/50">
                    <div
                      className="h-full bg-hud-accent"
                      style={{
                        width: `${Math.round(Number(convergence.peak_confidence) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[9px] text-hud-muted">
                    cross-source verified
                  </span>
                </div>
              </div>
            </aside>
          )}

          {/* Source + map action bar */}
          <div className="flex flex-wrap gap-3 mb-8 border-y border-hud-border/40 py-4">
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-mono text-[11px] text-hud-accent border border-hud-accent/40 px-3 py-1.5 rounded hover:bg-hud-accent/10"
              >
                ORIGINAL SOURCE →
              </a>
            )}
            {event.lat != null && event.lng != null && (
              <Link
                href={`/?lat=${event.lat}&lng=${event.lng}&zoom=8`}
                className="font-mono text-[11px] text-hud-muted border border-hud-border/50 px-3 py-1.5 rounded hover:border-hud-accent/30"
              >
                OPEN ON MAP →
              </Link>
            )}
            {event.source && (
              <span className="font-mono text-[10px] text-hud-muted/70 self-center">
                via {event.source}
              </span>
            )}
          </div>

          {/* AdSense report-inline slot */}
          {AD_PLACEMENTS.report
            .filter((p) => p.enabled && p.type === "adsense" && p.position === "inline" && p.slot)
            .map((p) => (
              <div key={p.id} className="my-6">
                <AdSenseUnit
                  slot={p.slot!}
                  format={p.format as "horizontal" | "rectangle" | "vertical" | "auto"}
                />
              </div>
            ))}

          {/* Inline CTA */}
          <div className="mb-8 border border-hud-accent/30 bg-hud-panel/40 rounded-lg p-4">
            <div className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-2">
              ⚡ STAY AHEAD
            </div>
            <p className="font-mono text-xs text-hud-muted mb-3 leading-relaxed">
              Events like this, convergence-verified across 689 sources, land
              in your inbox every Sunday. Free.
            </p>
            <Link
              href="/briefing"
              className="inline-block font-mono text-[11px] text-hud-base bg-hud-accent px-4 py-2 rounded hover:bg-hud-accent/80"
            >
              GET THE SUNDAY BRIEFING →
            </Link>
          </div>

          {/* Related events */}
          {related.length > 0 && (
            <section className="border-t border-hud-border/40 pt-6">
              <h2 className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-3">
                RELATED · {event.country_code || event.category || "INTEL"}
              </h2>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/events/${r.id}`}
                      className="font-mono text-xs text-hud-muted hover:text-hud-text block border border-hud-border/30 rounded px-3 py-2 hover:border-hud-accent/30"
                    >
                      <span className="text-hud-accent">
                        [{(r.category || "intel").toUpperCase()}]
                      </span>{" "}
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Footer trust */}
          <div className="mt-10 font-mono text-[9px] text-hud-muted/60 text-center">
            <Link href="/editorial-policy" className="underline">
              Editorial policy
            </Link>{" "}
            ·{" "}
            <Link href="/corrections" className="underline">
              Report a correction
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
