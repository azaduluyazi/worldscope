import Link from "next/link";
import { BriefingSignupForm } from "./BriefingSignupForm";

/**
 * NewsletterInlineCTA — Mid-article signup form.
 *
 * Drop into any story/report/blog page around the 40-60% scroll mark.
 * Renders server-side by default; the child form is a client component.
 */

interface Props {
  variant?: "compact" | "full";
  source?: string;
}

export function NewsletterInlineCTA({
  variant = "full",
  source = "inline-cta",
}: Props) {
  if (variant === "compact") {
    return (
      <div className="my-6 border border-hud-accent/30 bg-hud-panel/40 rounded-lg p-4">
        <div className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-2">
          ⚡ KEEP READING
        </div>
        <p className="font-mono text-xs text-hud-muted mb-3 leading-relaxed">
          Get the Sunday Convergence Report — weekly AI-curated intelligence
          from 689 sources, free in your inbox.
        </p>
        <BriefingSignupForm source={source} compact />
      </div>
    );
  }

  return (
    <aside className="my-8 border border-hud-accent/30 bg-gradient-to-br from-hud-panel/60 to-hud-panel/20 rounded-xl p-6 md:p-8">
      <div className="font-mono text-[10px] text-hud-accent uppercase tracking-[0.2em] mb-3">
        THE SUNDAY CONVERGENCE REPORT
      </div>
      <h3 className="font-display text-xl md:text-2xl font-bold text-hud-text mb-2">
        The signal, before the wire
      </h3>
      <p className="font-mono text-xs md:text-sm text-hud-muted mb-5 leading-relaxed max-w-2xl">
        Every Sunday at 07:00 UTC, we send a PDF digest of convergent
        intelligence signals from <strong>689 sources</strong> across{" "}
        <strong>195 countries</strong>. Used by analysts, traders and
        journalists. Free forever.
      </p>
      <BriefingSignupForm source={source} />
      <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[10px] text-hud-muted">
        <div>No spam · Unsubscribe in one click</div>
        <Link
          href="/newsletter/sample"
          className="text-hud-accent underline decoration-dotted hover:decoration-solid"
        >
          Read a sample →
        </Link>
      </div>
    </aside>
  );
}
