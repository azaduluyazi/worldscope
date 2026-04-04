import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES, COUNTRY_MAP } from "@/config/countries";
import { CountryDashboard } from "@/components/country/CountryDashboard";

export async function generateStaticParams() {
  return COUNTRIES.map((c) => ({ code: c.code.toLowerCase() }));
}

export const dynamic = "force-dynamic";

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
      "OSINT",
      "real-time monitoring",
      "global intelligence",
      "WorldScope",
    ],
    alternates: {
      canonical: `https://troiamedia.com/country/${code.toLowerCase()}`,
    },
  };
}

/** Server-rendered SEO content visible to search engine crawlers */
function CountrySEOContent({ name, region, code }: { name: string; region: string; code: string }) {
  // Neighboring regions for context
  const regionCountries = COUNTRIES.filter(
    (c) => c.region === region && c.code !== code.toUpperCase()
  ).slice(0, 8);

  return (
    <section className="sr-only" aria-label={`${name} Intelligence Overview`}>
      <h1>{name} Intelligence Report — WorldScope</h1>
      <p>
        Real-time intelligence monitoring and threat analysis for {name}, located in {region}.
        WorldScope tracks live events, security incidents, economic data, conflict zones, cyber
        threats, weather emergencies, and geopolitical developments across {name} using 570+
        verified intelligence sources and 48 API integrations.
      </p>
      <h2>{name} Monitoring Categories</h2>
      <ul>
        <li>Security &amp; Conflict Events — Armed conflicts, terrorism, military operations in {name}</li>
        <li>Cyber Threats — CVEs, ransomware, APT activity, data breaches affecting {name}</li>
        <li>Economic Indicators — Market data, trade flows, sanctions, commodity prices for {name}</li>
        <li>Weather &amp; Natural Disasters — Earthquakes, floods, storms, wildfires in {name}</li>
        <li>Political Developments — Elections, protests, policy changes, diplomatic relations</li>
        <li>Health &amp; Pandemic Tracking — Disease outbreaks, public health alerts in {name}</li>
      </ul>
      <h2>About WorldScope Intelligence Dashboard</h2>
      <p>
        WorldScope provides real-time global intelligence monitoring with interactive 3D globe
        visualization, AI-powered analysis, and comprehensive coverage across 195 countries.
        Track events in {name} and worldwide with severity-coded alerts, live maps, flight
        tracking, vessel monitoring, and fire detection powered by NASA FIRMS data.
      </p>
      {regionCountries.length > 0 && (
        <>
          <h2>Other Countries in {region}</h2>
          <nav aria-label={`${region} countries`}>
            <ul>
              {regionCountries.map((c) => (
                <li key={c.code}>
                  <a href={`/country/${c.code.toLowerCase()}`}>
                    {c.name} Intelligence Report
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </section>
  );
}

/** JSON-LD structured data for country page */
function CountryJsonLd({ name, region, code }: { name: string; region: string; code: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${name} Intelligence Report — WorldScope`,
    description: `Real-time intelligence monitoring for ${name}. Events, threat analysis, and security updates.`,
    url: `https://troiamedia.com/country/${code.toLowerCase()}`,
    isPartOf: {
      "@type": "WebSite",
      name: "WorldScope",
      url: "https://troiamedia.com",
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
        { "@type": "ListItem", position: 1, name: "Home", item: "https://troiamedia.com" },
        { "@type": "ListItem", position: 2, name: region, item: `https://troiamedia.com#${region.toLowerCase().replace(/\s/g, "-")}` },
        { "@type": "ListItem", position: 3, name: `${name} Intelligence`, item: `https://troiamedia.com/country/${code.toLowerCase()}` },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
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
      <CountryDashboard country={country} />
    </>
  );
}
