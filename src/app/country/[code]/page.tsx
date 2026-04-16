import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES, COUNTRY_MAP } from "@/config/countries";
import { CountryDashboard } from "@/components/country/CountryDashboard";
import { AdSenseUnit } from "@/components/ads";
import { AD_PLACEMENTS } from "@/config/ads";

export async function generateStaticParams() {
  return COUNTRIES.map((c) => ({ code: c.code.toLowerCase() }));
}

/**
 * ISR: pages are statically generated at build time via generateStaticParams,
 * then revalidated every hour. This gives Google Bot fast crawling (static HTML)
 * while keeping data reasonably fresh. Previously `force-dynamic` which forced
 * server-render on every request — bad for SEO crawl budget.
 */
export const revalidate = 3600; // 1 hour ISR

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  if (!country) return { title: "Country Not Found — WorldScope" };

  const title = `${country.name} Intelligence Report — WorldScope`;
  const description = `Real-time intelligence monitoring for ${country.name}. Live events, threat analysis, security updates, economic indicators, and geopolitical risk assessment. Track conflicts, cyber threats, weather events, and breaking news in ${country.name} (${country.region}) with WorldScope's 570+ source global intelligence dashboard.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    keywords: [
      `${country.name} news`,
      `${country.name} intelligence`,
      `${country.name} security`,
      `${country.name} threat analysis`,
      `${country.name} geopolitics`,
      `${country.name} risk assessment`,
      `${country.name} conflict`,
      `${country.name} cyber threats`,
      `${country.name} real-time`,
      `${country.region} intelligence`,
      "OSINT",
      "real-time monitoring",
      "global intelligence",
      "country risk index",
      "threat dashboard",
      "WorldScope",
    ],
    alternates: {
      canonical: `https://troiamedia.com/country/${code.toLowerCase()}`,
    },
  };
}

/** Server-rendered SEO content visible to both crawlers and users */
function CountrySEOContent({ name, region, code }: { name: string; region: string; code: string }) {
  const regionCountries = COUNTRIES.filter(
    (c) => c.region === region && c.code !== code.toUpperCase()
  ).slice(0, 8);

  return (
    <section className="max-w-5xl mx-auto px-4 py-6 font-mono text-hud-text" aria-label={`${name} Intelligence Overview`}>
      <h1 className="text-lg font-bold text-cyan-400 mb-2">{name} Intelligence Report</h1>
      <p className="text-[11px] text-hud-muted leading-relaxed mb-4">
        Real-time intelligence monitoring for {name} ({region}). Tracking security incidents,
        cyber threats, economic indicators, weather events, and geopolitical developments
        via 570+ verified sources.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-hud-muted mb-4">
        <span>■ Security &amp; Conflict</span>
        <span>■ Cyber Threats</span>
        <span>■ Economic Data</span>
        <span>■ Weather &amp; Disasters</span>
        <span>■ Political Events</span>
        <span>■ Health &amp; Pandemic</span>
      </div>
      {regionCountries.length > 0 && (
        <nav className="text-[10px] text-hud-muted" aria-label={`${region} countries`}>
          <span className="text-hud-text">Also in {region}: </span>
          {regionCountries.map((c, i) => (
            <span key={c.code}>
              <a href={`/country/${c.code.toLowerCase()}`} className="text-cyan-500/70 hover:text-cyan-400">
                {c.name}
              </a>
              {i < regionCountries.length - 1 && ", "}
            </span>
          ))}
        </nav>
      )}
    </section>
  );
}

/** JSON-LD structured data for country page — includes FAQPage for rich snippets */
function CountryJsonLd({ name, region, code }: { name: string; region: string; code: string }) {
  const siteUrl = "https://troiamedia.com";

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${name} Intelligence Report — WorldScope`,
    description: `Real-time intelligence monitoring for ${name}. Events, threat analysis, and security updates.`,
    url: `${siteUrl}/country/${code.toLowerCase()}`,
    isPartOf: {
      "@type": "WebSite",
      name: "WorldScope",
      url: siteUrl,
    },
    about: {
      "@type": "Country",
      name: name,
      containedInPlace: {
        "@type": "Place",
        name: region,
      },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: region, item: `${siteUrl}#${region.toLowerCase().replace(/\s/g, "-")}` },
        { "@type": "ListItem", position: 3, name: `${name} Intelligence`, item: `${siteUrl}/country/${code.toLowerCase()}` },
      ],
    },
  };

  // FAQPage schema — generates rich snippets in Google SERPs
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What threats are currently active in ${name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `WorldScope monitors active conflicts, terrorism, cyber threats, natural disasters, and political events in ${name} using 570+ verified intelligence sources updated in real-time.`,
        },
      },
      {
        "@type": "Question",
        name: `How does WorldScope track events in ${name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `WorldScope aggregates data from 549 RSS feeds, 137 APIs, and 232 live international news channels across 30 languages, with AI-powered severity classification and anomaly detection for ${name} and ${region}.`,
        },
      },
      {
        "@type": "Question",
        name: `Is ${name} intelligence data free to access?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, WorldScope provides free, real-time intelligence monitoring for all 195 countries including ${name}. No account or login required. Access the dashboard at troiamedia.com.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </>
  );
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  if (!country) notFound();

  return (
    <>
      <CountryJsonLd name={country.name} region={country.region} code={code} />
      <CountrySEOContent name={country.name} region={country.region} code={code} />
      {AD_PLACEMENTS.country
        .filter((p) => p.enabled && p.type === "adsense" && p.slot)
        .map((p) => (
          <div key={p.id} className="max-w-5xl mx-auto px-4 py-2">
            <AdSenseUnit
              slot={p.slot!}
              format={p.format as "horizontal" | "rectangle" | "vertical" | "auto"}
            />
          </div>
        ))}
      <CountryDashboard country={country} />
    </>
  );
}
