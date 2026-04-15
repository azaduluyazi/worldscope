import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

export const metadata: Metadata = {
  title: "Editorial Policy — How WorldScope Gathers, Verifies and Publishes",
  description:
    "WorldScope's editorial standards: source selection, AI curation, human review, correction policy, conflict of interest, and funding transparency.",
  alternates: { canonical: `${SITE_URL}/editorial-policy` },
};

export default function EditorialPolicyPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Editorial Policy", url: `${SITE_URL}/editorial-policy` },
        ]}
      />
      <main className="min-h-screen bg-hud-base text-hud-text overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 prose-invert">
          <div className="font-mono text-[10px] text-hud-accent uppercase tracking-[0.2em] mb-2">
            EDITORIAL STANDARDS
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Editorial Policy
          </h1>
          <p className="font-mono text-xs text-hud-muted mb-8">
            Last updated: {new Date().toISOString().slice(0, 10)}
          </p>

          <Section title="Mission">
            <p>
              TroiaMedia operates WorldScope, a real-time global intelligence
              dashboard aggregating open-source information from 689 verified
              sources across 195 countries and 30 languages. Our mission is to
              surface signals that matter — conflict, cyber, health, finance,
              energy and weather — with transparent provenance and before the
              commercial wire services.
            </p>
          </Section>

          <Section title="How we gather information">
            <p>
              All signals on WorldScope originate from public, machine-readable
              sources: government feeds, open-data registries, licensed RSS,
              APIs from established OSINT providers (USGS, ESA Copernicus,
              OpenSky Network, MarineTraffic, GDACS, ReliefWeb, ACLED, ICJ,
              IAEA), regional newswires, and verified accounts on Telegram,
              X and Mastodon. Sources are rated A–F for reliability and are
              reviewed quarterly. The full source directory is public at{" "}
              <Link href="/feeds" className="text-hud-accent underline">
                /feeds
              </Link>
              .
            </p>
          </Section>

          <Section title="AI-assisted curation">
            <p>
              We use language models (Groq Llama, Google Gemini, Anthropic
              Claude) to dedupe, cluster, summarize and translate. Every
              AI-generated summary is labeled as such and includes links to the
              underlying primary sources. Models never invent citations; any
              hallucinated reference is treated as a critical bug and
              corrected. Automation handles routine aggregation; editorial
              decisions about what to surface, highlight or contextualize are
              reviewed by a human editor.
            </p>
          </Section>

          <Section title="Fact-check and verification">
            <p>
              Single-source claims are flagged visually as <em>unconfirmed</em>{" "}
              until corroborated by at least one independent source. Our
              convergence engine automatically surfaces stories where three or
              more sources agree. Stories labeled as <strong>breaking</strong>{" "}
              include a live-confidence badge that updates as verification
              progresses.
            </p>
          </Section>

          <Section title="Corrections policy">
            <p>
              We correct errors promptly and visibly. When a story or signal is
              materially incorrect, we update the page, add a correction notice
              at the top with the date, and list the change at{" "}
              <Link href="/corrections" className="text-hud-accent underline">
                /corrections
              </Link>
              . Typos are fixed silently. To report an error, email{" "}
              <a
                href="mailto:corrections@troiamedia.com"
                className="text-hud-accent underline"
              >
                corrections@troiamedia.com
              </a>{" "}
              or use the{" "}
              <Link href="/contact" className="text-hud-accent underline">
                contact form
              </Link>
              .
            </p>
          </Section>

          <Section title="Independence, ownership and funding">
            <p>
              TroiaMedia is owned and operated by Azad Uluyazi, an independent
              publisher. The site is funded by display advertising (Google
              AdSense and Carbon Ads). We accept no sponsored content, no
              affiliate placements in editorial areas, and no payments for
              coverage. Advertisers have no advance view of or influence over
              editorial output. Display ads are clearly labeled and separated
              from content.
            </p>
          </Section>

          <Section title="Conflict of interest">
            <p>
              Editors and contributors disclose material conflicts of interest
              on their author pages and recuse themselves from stories where
              financial, personal or professional interests could create the
              appearance of bias. We do not hold positions in securities we
              regularly cover in the Finance variant.
            </p>
          </Section>

          <Section title="Use of AI crawlers">
            <p>
              We disallow automated scraping by commercial AI training crawlers
              (GPTBot, CCBot, Google-Extended, anthropic-ai) via robots.txt.
              Our content is available for non-commercial research under a CC
              BY 4.0 license when cited with a link back to the source page.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Editorial inquiries:{" "}
              <a
                href="mailto:editorial@troiamedia.com"
                className="text-hud-accent underline"
              >
                editorial@troiamedia.com
              </a>
              <br />
              Corrections:{" "}
              <a
                href="mailto:corrections@troiamedia.com"
                className="text-hud-accent underline"
              >
                corrections@troiamedia.com
              </a>
              <br />
              Press &amp; partnerships:{" "}
              <a
                href="mailto:press@troiamedia.com"
                className="text-hud-accent underline"
              >
                press@troiamedia.com
              </a>
            </p>
          </Section>
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl font-bold text-hud-accent mb-2 mt-6">
        {title}
      </h2>
      <div className="font-mono text-xs md:text-sm text-hud-muted leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
