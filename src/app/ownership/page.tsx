import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

export const metadata: Metadata = {
  title: "Ownership & Funding — TroiaMedia",
  description:
    "Who owns TroiaMedia and how it's funded. Full transparency on ownership structure, revenue sources, and editorial independence.",
  alternates: { canonical: `${SITE_URL}/ownership` },
};

export default function OwnershipPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Ownership", url: `${SITE_URL}/ownership` },
        ]}
      />
      <main className="min-h-screen bg-hud-base text-hud-text overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <div className="font-mono text-[10px] text-hud-accent uppercase tracking-[0.2em] mb-2">
            TRANSPARENCY
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Ownership &amp; Funding
          </h1>

          <div className="space-y-6 font-mono text-xs md:text-sm text-hud-muted leading-relaxed">
            <section>
              <h2 className="font-display text-lg font-bold text-hud-accent mb-2">
                Publisher
              </h2>
              <p>
                TroiaMedia and its flagship product WorldScope are owned and
                operated by <strong className="text-hud-text">Azad Uluyazi</strong>,
                an independent publisher based in Türkiye. TroiaMedia is not
                part of any media group, political organization, or
                government body. There are no outside shareholders.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-hud-accent mb-2">
                How we make money
              </h2>
              <p>
                100% of revenue comes from display advertising served through{" "}
                <strong>Google AdSense</strong> and <strong>Carbon Ads</strong>.
                We do not run sponsored posts, affiliate links in editorial
                areas, paid placements, or native advertising disguised as
                editorial content. We have never accepted payment for
                coverage.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-hud-accent mb-2">
                Editorial independence
              </h2>
              <p>
                Advertisers have no advance view of editorial output, no
                influence over coverage, and no way to request changes,
                removals, or favorable treatment. Complaints from advertisers
                are handled by the publisher directly and recorded. Ad
                placements are algorithmically served and editorially
                uninvolved.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-hud-accent mb-2">
                Infrastructure
              </h2>
              <p>
                WorldScope runs on Vercel (hosting, edge network), Supabase
                (database, authentication) and Upstash (cache, rate limiting).
                Our domain registrar is Hostinger. None of these vendors have
                editorial access or influence.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-hud-accent mb-2">
                Contact
              </h2>
              <p>
                For questions about ownership, funding or independence, write
                to{" "}
                <a
                  href="mailto:publisher@troiamedia.com"
                  className="text-hud-accent underline"
                >
                  publisher@troiamedia.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
