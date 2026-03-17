import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-hud-base flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        {/* Glitch-style 404 */}
        <div className="relative">
          <h1 className="font-mono text-7xl font-bold text-hud-accent/20 tracking-widest select-none">
            404
          </h1>
          <h1 className="font-mono text-7xl font-bold text-hud-accent tracking-widest absolute inset-0 animate-pulse">
            404
          </h1>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs text-severity-critical tracking-wider font-bold">
            ⚠ SIGNAL LOST
          </p>
          <p className="font-mono text-sm text-hud-muted">
            The requested intelligence asset could not be located.
            <br />
            It may have been classified, moved, or does not exist.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="font-mono text-xs text-hud-accent border border-hud-accent/30 px-4 py-2 rounded hover:bg-hud-accent/10 transition-colors"
          >
            ← RETURN TO HQ
          </Link>
          <Link
            href="/reports"
            className="font-mono text-xs text-hud-muted border border-hud-border px-4 py-2 rounded hover:bg-hud-panel transition-colors"
          >
            VIEW REPORTS
          </Link>
        </div>

        {/* Decorative scan line */}
        <div className="pt-6">
          <div className="h-px bg-gradient-to-r from-transparent via-hud-accent/30 to-transparent" />
          <p className="font-mono text-[9px] text-hud-muted/50 mt-2 tracking-widest">
            WORLDSCOPE // SECTOR NOT FOUND
          </p>
        </div>
      </div>
    </div>
  );
}
