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
      const adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        pushed.current = true;
      }
    } catch {
      // AdSense not loaded
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

  return (
    <div className={`ad-unit ${className}`}>
      <div className="font-mono text-[7px] text-hud-muted mb-1 text-center tracking-wider">
        ADVERTISEMENT
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={ADSENSE_PUB_ID}
        data-ad-slot={slot}
        data-ad-format={format === "auto" ? "auto" : undefined}
        data-full-width-responsive={format === "horizontal" ? "true" : undefined}
      />
    </div>
  );
}
