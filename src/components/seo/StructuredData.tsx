/**
 * StructuredData — Reusable Schema.org JSON-LD components for WorldScope.
 *
 * Emits schema types Google AI Overview + Discover + Dataset Search favor in 2026:
 * - LiveBlogPosting (live event pages)
 * - NewsArticle (reports, blog posts)
 * - Dataset (country stat pages, /developers data)
 * - ClaimReview (fact-check blocks)
 * - SpeakableSpecification (voice-assistant surfacing)
 * - BreadcrumbList (all deep pages)
 * - FAQPage (only where FAQ content actually exists)
 */

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

function LdScript({ data }: { data: JsonLd }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";
const PUBLISHER = {
  "@type": "Organization",
  name: "TroiaMedia",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/icons/icon-512.svg`,
    width: 512,
    height: 512,
  },
};

// ─────────────────────────────────────────────
// NewsArticle — for reports, briefings, blog posts

export interface NewsArticleProps {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  authorName?: string;
  authorUrl?: string;
  section?: string;
  keywords?: string[];
}

export function NewsArticleSchema(props: NewsArticleProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: props.headline,
    description: props.description,
    url: props.url,
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    image: props.image
      ? [props.image]
      : [`${SITE_URL}/opengraph-image`],
    mainEntityOfPage: { "@type": "WebPage", "@id": props.url },
    author: {
      "@type": "Person",
      name: props.authorName || "TroiaMedia Intelligence Desk",
      url: props.authorUrl || `${SITE_URL}/about`,
    },
    publisher: PUBLISHER,
    articleSection: props.section || "Intelligence",
    keywords: (props.keywords || []).join(", "),
    isAccessibleForFree: true,
  };
  return <LdScript data={data} />;
}

// ─────────────────────────────────────────────
// LiveBlogPosting — for active event coverage (real-time pages)

export interface LiveBlogUpdate {
  datePublished: string;
  headline: string;
  text: string;
  url?: string;
}

export interface LiveBlogPostingProps {
  headline: string;
  description: string;
  url: string;
  coverageStartTime: string;
  coverageEndTime?: string;
  updates: LiveBlogUpdate[];
}

export function LiveBlogPostingSchema(props: LiveBlogPostingProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LiveBlogPosting",
    headline: props.headline,
    description: props.description,
    url: props.url,
    coverageStartTime: props.coverageStartTime,
    ...(props.coverageEndTime && { coverageEndTime: props.coverageEndTime }),
    about: {
      "@type": "Event",
      name: props.headline,
      startDate: props.coverageStartTime,
      ...(props.coverageEndTime && { endDate: props.coverageEndTime }),
      eventStatus: "https://schema.org/EventScheduled",
    },
    publisher: PUBLISHER,
    author: {
      "@type": "Organization",
      name: "TroiaMedia Intelligence Desk",
      url: `${SITE_URL}/about`,
    },
    liveBlogUpdate: props.updates.map((u) => ({
      "@type": "BlogPosting",
      headline: u.headline,
      articleBody: u.text,
      datePublished: u.datePublished,
      ...(u.url && { url: u.url }),
    })),
  };
  return <LdScript data={data} />;
}

// ─────────────────────────────────────────────
// Dataset — for country stat pages & /developers data

export interface DatasetSchemaProps {
  name: string;
  description: string;
  url: string;
  keywords?: string[];
  spatialCoverage?: string;
  temporalCoverage?: string;
  datePublished?: string;
  distribution?: Array<{
    encodingFormat: string;
    contentUrl: string;
  }>;
}

export function DatasetSchema(props: DatasetSchemaProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: props.name,
    description: props.description,
    url: props.url,
    keywords: props.keywords || [
      "OSINT",
      "real-time intelligence",
      "global events",
    ],
    creator: PUBLISHER,
    publisher: PUBLISHER,
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    ...(props.spatialCoverage && { spatialCoverage: props.spatialCoverage }),
    ...(props.temporalCoverage && { temporalCoverage: props.temporalCoverage }),
    ...(props.datePublished && { datePublished: props.datePublished }),
    ...(props.distribution && {
      distribution: props.distribution.map((d) => ({
        "@type": "DataDownload",
        encodingFormat: d.encodingFormat,
        contentUrl: d.contentUrl,
      })),
    }),
  };
  return <LdScript data={data} />;
}

// ─────────────────────────────────────────────
// ClaimReview — fact-check trust signal

export interface ClaimReviewProps {
  claimReviewed: string;
  url: string;
  datePublished: string;
  reviewRating: {
    ratingValue: number; // 1 = false, 5 = true
    alternateName: string; // "False", "Mostly True", etc.
  };
  author?: string;
}

export function ClaimReviewSchema(props: ClaimReviewProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    url: props.url,
    datePublished: props.datePublished,
    claimReviewed: props.claimReviewed,
    author: {
      "@type": "Organization",
      name: props.author || "TroiaMedia Fact-Check Desk",
      url: `${SITE_URL}/about`,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: props.reviewRating.ratingValue,
      bestRating: 5,
      worstRating: 1,
      alternateName: props.reviewRating.alternateName,
    },
  };
  return <LdScript data={data} />;
}

// ─────────────────────────────────────────────
// Speakable — for voice-assistant surfacing (Google Assistant, Alexa)

export interface SpeakableProps {
  cssSelectors: string[]; // e.g., ["h1", ".summary"]
}

export function SpeakableSchema({ cssSelectors }: SpeakableProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: cssSelectors,
    },
  };
  return <LdScript data={data} />;
}

// ─────────────────────────────────────────────
// BreadcrumbList — deep-page context

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return <LdScript data={data} />;
}

// ─────────────────────────────────────────────
// Event — for specific real-time events (earthquakes, cyber incidents, etc.)

export interface EventSchemaProps {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: {
    name: string;
    lat?: number;
    lon?: number;
  };
  url: string;
  eventStatus?: "scheduled" | "active" | "completed" | "cancelled";
}

export function EventSchema(props: EventSchemaProps) {
  const statusMap = {
    scheduled: "https://schema.org/EventScheduled",
    active: "https://schema.org/EventScheduled",
    completed: "https://schema.org/EventScheduled",
    cancelled: "https://schema.org/EventCancelled",
  };
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsEvent",
    name: props.name,
    description: props.description,
    startDate: props.startDate,
    ...(props.endDate && { endDate: props.endDate }),
    eventStatus: statusMap[props.eventStatus || "active"],
    ...(props.location && {
      location: {
        "@type": "Place",
        name: props.location.name,
        ...(props.location.lat != null &&
          props.location.lon != null && {
            geo: {
              "@type": "GeoCoordinates",
              latitude: props.location.lat,
              longitude: props.location.lon,
            },
          }),
      },
    }),
    url: props.url,
    organizer: PUBLISHER,
  };
  return <LdScript data={data} />;
}
