/**
 * Server-rendered SEO content for dashboard pages.
 * Provides meaningful text content for search engine crawlers that cannot
 * fully render client-side DashboardShell components.
 */

const VARIANT_SEO: Record<string, { heading: string; description: string; features: string[] }> = {
  conflict: {
    heading: "ConflictScope — Real-Time Conflict & Security Monitor",
    description:
      "Track active conflicts, military operations, OREF rocket alerts, ACLED/UCDP incident data, and global security events. Live interactive map with severity classification across 195 countries.",
    features: [
      "Live conflict mapping with severity layers",
      "OREF Israel rocket alert integration",
      "ACLED & UCDP armed conflict data",
      "Military operations & drone strike tracking",
      "Protest and civil unrest monitoring",
      "Nuclear threat assessment",
    ],
  },
  finance: {
    heading: "FinScope — Financial Intelligence Dashboard",
    description:
      "Monitor global financial markets, cryptocurrency prices, commodity futures, central bank rates, and economic indicators in real-time. Fear & Greed Index, prediction markets, and geopolitical market impact analysis.",
    features: [
      "Real-time stock market & forex data",
      "Cryptocurrency price tracker (BTC, ETH, SOL)",
      "Commodity prices (gold, oil, silver, wheat)",
      "Central bank interest rate monitor",
      "Fear & Greed Index",
      "Prediction markets (Polymarket, Kalshi)",
    ],
  },
  cyber: {
    heading: "CyberScope — Cybersecurity Threat Monitor",
    description:
      "Real-time cybersecurity intelligence including ransomware attacks, data breaches, vulnerability disclosures (CVE), DDoS incidents, and APT group tracking across global networks.",
    features: [
      "Ransomware attack tracker",
      "Data breach monitoring",
      "CVE vulnerability feed",
      "DDoS attack map",
      "APT group activity tracking",
      "Critical infrastructure threats",
    ],
  },
  energy: {
    heading: "EnergyScope — Energy & Infrastructure Monitor",
    description:
      "Monitor oil, gas, nuclear, and renewable energy infrastructure worldwide. Pipeline maps, power grid outages, OPEC decisions, LNG shipment tracking, and critical energy infrastructure alerts.",
    features: [
      "Oil & natural gas price tracking",
      "Nuclear power plant monitoring",
      "Renewable energy capacity data",
      "Pipeline & infrastructure mapping",
      "Power grid outage alerts",
      "OPEC decision tracker",
    ],
  },
  health: {
    heading: "HealthScope — Global Health & Pandemic Monitor",
    description:
      "Track disease outbreaks, pandemic data, WHO alerts, vaccination progress, and health emergencies worldwide. Epidemiological surveillance and public health threat intelligence.",
    features: [
      "Disease outbreak tracking",
      "WHO & CDC alert integration",
      "Pandemic surveillance data",
      "Vaccination progress tracker",
      "Health emergency mapping",
      "Epidemiological trend analysis",
    ],
  },
  sports: {
    heading: "SportsScope — Live Sports Intelligence",
    description:
      "Real-time sports scores, match results, league standings, and tournament tracking across football, basketball, tennis, and more. Live event monitoring with global coverage.",
    features: [
      "Live match scores & results",
      "League standings & fixtures",
      "Tournament bracket tracking",
      "Transfer news monitoring",
      "Multi-sport coverage",
      "Real-time event alerts",
    ],
  },
  tech: {
    heading: "TechScope — Technology Intelligence Dashboard",
    description:
      "Monitor technology news, startup funding, product launches, AI developments, and tech industry trends. Hacker News, Product Hunt, and venture capital deal tracking.",
    features: [
      "AI & machine learning news tracker",
      "Startup funding & VC deal monitor",
      "Product launch tracking",
      "Tech industry trend analysis",
      "Hacker News top stories integration",
      "Open source project monitoring",
    ],
  },
  weather: {
    heading: "WeatherScope — Extreme Weather & Disaster Monitor",
    description:
      "Track severe weather events, natural disasters, earthquakes, hurricanes, wildfires, and climate alerts worldwide. Real-time satellite imagery and impact assessment.",
    features: [
      "Earthquake monitoring (USGS/EMSC)",
      "Hurricane & typhoon tracking",
      "Wildfire detection & mapping",
      "Severe weather alerts",
      "Flood & tsunami warnings",
      "Climate event impact assessment",
    ],
  },
  commodity: {
    heading: "Commodity Markets — Real-Time Price Tracker",
    description:
      "Track global commodity prices including oil, gold, silver, natural gas, wheat, and agricultural markets. Futures data, supply chain analysis, and market intelligence.",
    features: [
      "Oil & energy commodity prices",
      "Precious metals (gold, silver, platinum)",
      "Agricultural commodity tracking",
      "Commodity futures data",
      "Supply chain disruption alerts",
      "Market trend analysis",
    ],
  },
  happy: {
    heading: "Good News — Positive Global Developments",
    description:
      "Discover uplifting stories, scientific breakthroughs, humanitarian progress, and positive developments from around the world. A curated feed of good news and hope.",
    features: [
      "Scientific breakthroughs & discoveries",
      "Humanitarian progress stories",
      "Environmental conservation wins",
      "Medical & health advances",
      "Community & social impact",
      "Technology for good",
    ],
  },
};

export function DashboardSEO({ variant }: { variant: string }) {
  const seo = VARIANT_SEO[variant];
  if (!seo) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo.heading,
    description: seo.description,
    url: `https://troiamedia.com/${variant === "world" ? "" : variant}`,
    isPartOf: {
      "@type": "WebSite",
      name: "WorldScope",
      url: "https://troiamedia.com",
    },
  };

  // Visible intro block removed — caused layout shift on vertical pages and
  // redundant with DashboardShell SSR + meta tags. JSON-LD retained for Google.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
