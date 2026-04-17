"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_PUB_ID } from "@/config/ads";

interface AdSenseUnitProps {
  slot: string;
  format?: "horizontal" | "rectangle" | "vertical" | "auto";
  className?: string;
}

/**
 * Google AdSense display unit.
 * Only renders when ADSENSE_PUB_ID is configured and consent is given.
 *
 * Follows the OFFICIAL AdSense pattern recommended by Google:
 *   (window.adsbygoogle = window.adsbygoogle || []).push({})
 *
 * Why this pattern matters: our next/script tag for adsbygoogle.js uses
 * `strategy="afterInteractive"`, which means it loads AFTER React hydrates.
 * This component's useEffect fires during/right after hydration, often BEFORE
 * the AdSense script has executed. The previous `if (adsbygoogle) push(...)`
 * guard silently returned when the global was still undefined, leaving
 * pushed.current = false, and the effect has `[]` deps — so it never retried.
 * Net effect: every ad slot shipped "unfilled" on every page load.
 *
 * The lazy-init queue pattern handles this race for us: adsbygoogle.js picks
 * up queued pushes once it loads. Correctness doesn't depend on script arrival
 * order any more.
 */
export function AdSenseUnit({ slot, format = "auto", className = "" }: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_PUB_ID || pushed.current) return;

    // Allow bots/crawlers to see ad slots (they don't have localStorage).
    // For real users, respect consent preference.
    const isBot = typeof navigator !== "undefined" &&
      /bot|crawler|spider|googlebot|mediapartners/i.test(navigator.userAgent);

    if (!isBot && typeof window !== "undefined" &&
        window.localStorage.getItem("ws-ad-consent") !== "granted") {
      return;
    }

    try {
      // Lazy-init the adsbygoogle queue and push unconditionally.
      // If adsbygoogle.js has already loaded, push() fires immediately.
      // If not, our push sits in the queue and fires when the script arrives.
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // Malformed environment (e.g. CSP blocked script) — skip silently.
    }
  }, []);

  if (!ADSENSE_PUB_ID) return null;
  // Safety: never render slots that are placeholders, zero, or empty.
  // Prevents accidental AdSense policy violations if a placement is
  // enabled without a real slot ID assigned in the dashboard.
  if (!slot || slot === "0" || !/^\d{10}$/.test(slot)) return null;

  const style: React.CSSProperties = {
    display: "block",
    ...(format === "horizontal" && { width: "100%", height: "90px" }),
    ...(format === "rectangle" && { width: "300px", height: "250px" }),
    ...(format === "vertical" && { width: "160px", height: "600px" }),
  };

  // Wrapper min-height matches the ad slot so unfilled slots don't collapse
  // to 0px and hurt CLS. Horizontal: 90px, Rectangle: 250px, Vertical: 600px,
  // Auto: 100px as a reasonable minimum (Google usually returns ≥100px).
  const wrapperMinHeight =
    format === "horizontal" ? 90 :
    format === "rectangle" ? 250 :
    format === "vertical" ? 600 :
    100;

  return (
    <div className={`ad-unit ${className}`} style={{ minHeight: wrapperMinHeight }}>
      <div className="font-mono text-[7px] text-hud-muted mb-1 text-center tracking-wider">
        ADVERTISEMENT
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={ADSENSE_PUB_ID}
        data-ad-slot={slot}
        // Always emit data-ad-format so AdSense knows the expected shape.
        // Horizontal adds responsive flag so it adapts to viewport width.
        data-ad-format={format}
        data-full-width-responsive={format === "horizontal" ? "true" : undefined}
      />
    </div>
  );
}
