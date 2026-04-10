import Link from "next/link";

/**
 * Consistent footer for all legal/static pages.
 * Visible, accessible, accessible.
 */
export function LegalFooter() {
  return (
    <footer className="mt-12 pt-6 border-t border-hud-border">
      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-hud-muted mb-4">
        <Link href="/" className="hover:text-hud-accent transition-colors">Dashboard</Link>
        <Link href="/about" className="hover:text-hud-accent transition-colors">About</Link>
        <Link href="/blog" className="hover:text-hud-accent transition-colors">Blog</Link>
        <Link href="/pricing" className="hover:text-hud-accent transition-colors">Pricing</Link>
        <Link href="/terms" className="hover:text-hud-accent transition-colors">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-hud-accent transition-colors">Privacy Policy</Link>
        <Link href="/cookies" className="hover:text-hud-accent transition-colors">Cookie Policy</Link>
        <Link href="/disclaimer" className="hover:text-hud-accent transition-colors">Disclaimer</Link>
        <Link href="/accessibility" className="hover:text-hud-accent transition-colors">Accessibility</Link>
        <Link href="/refund" className="hover:text-hud-accent transition-colors">Refund Policy</Link>
        <Link href="/contact" className="hover:text-hud-accent transition-colors">Contact</Link>
      </div>
      <div className="font-mono text-[10px] text-hud-muted/60">
        <p>Troia Media &middot; Operated by Azad Uluyazi &middot; Istanbul, Turkey</p>
        <p>Contact: <a href="mailto:info@troiamedia.com" className="text-hud-accent/60 hover:text-hud-accent">info@troiamedia.com</a></p>
      </div>
    </footer>
  );
}
