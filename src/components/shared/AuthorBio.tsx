import Link from "next/link";

/**
 * Shared editorial attribution block used at the bottom of blog posts and
 * long-form analysis pages. Exists specifically to satisfy Google's E-E-A-T
 * expectations around identifiable human authorship — every article carries
 * a named editor, a named review workflow, and a path to contact that
 * editor directly.
 *
 * Paired with the "Human-reviewed" badge rendered in the post header. See
 * /editorial-policy for the full review workflow and /methodology for the
 * source-selection and verification criteria.
 */
export function AuthorBio() {
  return (
    <aside
      className="mt-10 border border-hud-border rounded-md bg-hud-panel/40 p-5"
      aria-label="Author and editorial review"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-full bg-hud-accent/10 border border-hud-accent/30 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="font-mono text-lg font-bold text-hud-accent">AU</span>
        </div>
        <div className="flex-1 text-[12px] leading-relaxed">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-mono text-sm font-semibold text-hud-text">
              Azad Uluyazi
            </h3>
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Editor
            </span>
          </div>
          <p className="text-hud-muted mb-2">
            Principal analyst and sole editor of WorldScope. A decade of
            hands-on work building data-driven web platforms, API
            integrations, and real-time intelligence pipelines. Based in
            Istanbul. Personally reviews every report, source addition, and
            AI-assisted analysis before publication.
          </p>
          <p className="text-hud-muted text-[11px]">
            Editorial feedback or correction requests:{" "}
            <a
              href="mailto:info@troiamedia.com"
              className="text-hud-accent hover:underline"
            >
              info@troiamedia.com
            </a>
            . See the{" "}
            <Link href="/editorial-policy" className="text-hud-accent hover:underline">
              editorial policy
            </Link>
            ,{" "}
            <Link href="/methodology" className="text-hud-accent hover:underline">
              methodology
            </Link>
            , and{" "}
            <Link href="/about" className="text-hud-accent hover:underline">
              about
            </Link>{" "}
            pages for full context.
          </p>
        </div>
      </div>
    </aside>
  );
}
