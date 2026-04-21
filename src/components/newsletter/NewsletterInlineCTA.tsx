import Link from "next/link";

/**
 * NewsletterInlineCTA — mid-article CTA.
 *
 * Rewritten 2026-04-21 for the single-tier pricing switch. The inline
 * form previously captured free email signups and handed them to
 * /api/newsletter/subscribe. That funnel is retired — this component
 * now points readers at Gaia ($9/mo), which includes the Sunday
 * Convergence Report plus dashboard unlocks.
 */

interface Props {
  variant?: "compact" | "full";
  source?: string;
}

export function NewsletterInlineCTA({ variant = "full" }: Props) {
  if (variant === "compact") {
    return (
      <div className="my-6 border border-amber-400/30 bg-amber-400/5 rounded-lg p-4">
        <div className="font-mono text-[10px] text-amber-300 uppercase tracking-wider mb-2">
          ⚡ KEEP READING
        </div>
        <p className="font-mono text-xs text-gray-400 mb-3 leading-relaxed">
          The Sunday Convergence Report — weekly AI-curated intelligence from
          689 sources — is part of Gaia.
        </p>
        <Link
          href="/pricing#gaia"
          className="inline-block px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider border border-amber-400/50 text-amber-300 hover:bg-amber-400/10"
        >
          SEE GAIA · $9/mo →
        </Link>
      </div>
    );
  }

  return (
    <aside className="my-8 border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-amber-400/[0.02] rounded-xl p-6 md:p-8">
      <div className="font-mono text-[10px] text-amber-300 uppercase tracking-[0.2em] mb-3">
        THE SUNDAY CONVERGENCE REPORT
      </div>
      <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-2">
        The signal, before the wire
      </h3>
      <p className="font-mono text-xs md:text-sm text-gray-300 mb-5 leading-relaxed max-w-2xl">
        Every Sunday at 07:00 UTC, a PDF digest of convergent intelligence
        signals from <strong>689 sources</strong> across{" "}
        <strong>195 countries</strong>. Delivered as part of{" "}
        <strong>Gaia</strong>, WorldScope&apos;s single subscription ($9/mo).
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/pricing#gaia"
          className="inline-block px-4 py-2 font-mono text-[12px] font-bold tracking-wider bg-amber-400 text-[#060509] hover:bg-amber-300"
        >
          SUBSCRIBE · $9/mo
        </Link>
        <Link
          href="/newsletter/sample"
          className="font-mono text-[11px] text-amber-300 underline decoration-dotted hover:decoration-solid"
        >
          Read a sample →
        </Link>
      </div>
    </aside>
  );
}
