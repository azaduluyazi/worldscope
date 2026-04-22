import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Methodology — WorldScope",
  description:
    "How WorldScope selects sources, processes intelligence signals, and applies human review to AI-assisted output. Full transparency on the data pipeline, severity taxonomy, and editorial workflow.",
  openGraph: {
    title: "Methodology — WorldScope",
    description:
      "Source selection, signal processing, severity taxonomy, and editorial review at WorldScope.",
    type: "article",
  },
  alternates: {
    canonical: "https://troiamedia.com/methodology",
  },
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-hud-base text-hud-text p-6 font-mono">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-hud-muted hover:text-hud-accent transition-colors mb-6"
        >
          &larr; Back to Dashboard
        </Link>

        <h1 className="text-xl font-bold text-hud-accent mb-1 tracking-wider uppercase">
          Methodology
        </h1>
        <p className="text-hud-muted text-xs mb-8">
          How we select sources, process signals, apply human review, and handle corrections.
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          <Section title="1. Source Selection">
            <p className="mb-3">
              Every source added to the WorldScope pipeline passes four gates
              before going live: publisher identity (the operating entity must
              be identifiable and reachable), editorial track record (the
              source must have a public correction or retraction history),
              technical reliability (a documented feed format with stable URIs
              and encoding), and legal standing (public-data licensing or open
              RSS availability). No source is added solely because it produces
              interesting content — we require the preceding four gates
              independently.
            </p>
            <p>
              The current pipeline covers roughly 570 vetted feeds spanning
              news agencies, government emergency services, financial-market
              APIs, seismic and meteorological networks, cybersecurity advisory
              bodies, and public health authorities. The aggregate roster is
              biased toward primary-source institutions (e.g. USGS, WHO, CISA,
              ECB) over aggregator outlets where possible.
            </p>
          </Section>

          <Section title="2. Signal Processing">
            <p className="mb-3">
              Incoming records are normalized into a common event schema with
              geolocation, severity class, topic vector, and source provenance.
              A convergence engine cross-references new events against the
              prior 72 hours of signals to flag corroboration across
              independent sources and to suppress near-duplicate records that
              originated from a single primary account. Signals that appear in
              only one source remain visible but carry explicit
              low-corroboration markers.
            </p>
            <p>
              Language handling is multilingual by default: we ingest and
              retain source material in its original language, with on-demand
              translation applied only at the presentation layer. This
              preserves provenance and avoids compounding translation error
              across chained AI steps.
            </p>
          </Section>

          <Section title="3. Severity Taxonomy">
            <p className="mb-3">
              Events are classified on a five-level scale — <strong>critical</strong>,{" "}
              <strong>high</strong>, <strong>medium</strong>, <strong>low</strong>,{" "}
              <strong>info</strong> — with each level defined by impact scope,
              affected population, and urgency. The classifier is a combination
              of rule-based heuristics (e.g. declared states of emergency auto-elevate)
              and AI-assisted scoring, with manual override available for any
              event. Classifications are audit-logged; if a severity is changed
              after first publication, the prior value and the reason are
              retained and visible to the user.
            </p>
            <p>
              Severity is an operational signal, not an editorial judgement
              about importance. A high-severity financial-market move is not
              claimed to be more important than a low-severity political
              development; the taxonomy describes immediate operational
              relevance for someone monitoring the country or topic in
              question.
            </p>
          </Section>

          <Section title="4. AI Assistance and Human Review">
            <p className="mb-3">
              WorldScope uses large-language-model assistance for specific,
              bounded tasks: headline clustering, severity classification
              scoring, entity extraction, and first-draft synthesis of weekly
              intelligence digests. AI output is never published without human
              review. Azad Uluyazi, the principal analyst, personally reads
              and approves every long-form analysis before it appears on the
              site.
            </p>
            <p className="mb-3">
              The AI models currently used include Groq-hosted open-weights
              models, Anthropic Claude, OpenAI GPT, and Google Gemini for
              specific embedding workloads. No single vendor is load-bearing,
              and any AI output in published material is disclosed with a
              clear &quot;AI-assisted, human-reviewed&quot; badge.
            </p>
            <p>
              We do not publish ghostwritten bylines, fabricated attribution,
              or AI-generated imagery that could be mistaken for photographic
              evidence of an event. Synthetic imagery, where used for
              illustrative purposes, is explicitly labeled.
            </p>
          </Section>

          <Section title="5. Corrections">
            <p className="mb-3">
              Corrections are handled transparently. When a published analysis
              or a classified event is found to be materially wrong, the entry
              is updated with a visible correction note indicating what
              changed and when. The prior incorrect content is not silently
              deleted from the record. Significant corrections are also logged
              to the{" "}
              <Link href="/corrections" className="text-hud-accent hover:underline">
                corrections page
              </Link>{" "}
              for external audit.
            </p>
            <p>
              If you identify an error, a misclassification, or a source that
              should be reviewed or removed, contact{" "}
              <a
                href="mailto:info@troiamedia.com"
                className="text-hud-accent hover:underline"
              >
                info@troiamedia.com
              </a>
              . Responses are issued by the same individual who operates the
              platform, not a generic support queue.
            </p>
          </Section>

          <Section title="6. Limitations">
            <p className="mb-3">
              No monitoring system is exhaustive. WorldScope depends on
              sources that themselves have imperfect coverage — there are
              countries, conflicts, and topics where public-feed availability
              is thin, language barriers are high, or state censorship limits
              what can be ingested. We mark sparse coverage where we recognize
              it and do not claim completeness.
            </p>
            <p>
              The platform is operated as an independent intelligence
              aggregator by a single editor supported by automated pipelines.
              It is not a substitute for professional intelligence services,
              legal advice, medical guidance, or evacuation-decision support.
              Event severity on WorldScope should be treated as one input
              among many, not as authoritative operational guidance.
            </p>
          </Section>

          <Section title="7. Independence">
            <p>
              WorldScope is self-funded through advertising revenue and
              optional paid subscriptions. We do not accept sponsored editorial
              placements, and no advertiser or subscriber has influence over
              source selection, severity classification, or the ordering or
              prominence of events on the dashboard. See the{" "}
              <Link href="/ownership" className="text-hud-accent hover:underline">
                ownership
              </Link>{" "}
              page for the full disclosure of funding sources and any
              commercial relationships.
            </p>
          </Section>
        </div>

        <LegalFooter />
      </div>
    </div>
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
    <div className="border border-hud-border rounded-sm p-4">
      <h2 className="text-sm font-bold text-hud-accent mb-2 tracking-wide uppercase">
        {title}
      </h2>
      <div className="text-hud-text/80">{children}</div>
    </div>
  );
}
