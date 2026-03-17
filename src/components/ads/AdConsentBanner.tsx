"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "ws-ad-consent";

/**
 * GDPR cookie consent banner for ad display.
 * Stores consent in localStorage. No cookies set before consent.
 */
export function AdConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no consent decision has been made
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === null) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "granted");
    setVisible(false);
    // Reload to activate ad scripts
    window.location.reload();
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "denied");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 animate-slide-in">
      <div className="max-w-2xl mx-auto bg-hud-surface border border-hud-border rounded-md p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-start gap-3">
          <span className="text-lg">🍪</span>
          <div className="flex-1">
            <p className="font-mono text-[11px] text-hud-text leading-relaxed">
              We use cookies and third-party ads to support WorldScope.
              Your data helps us provide free intelligence monitoring.
            </p>
            <p className="font-mono text-[9px] text-hud-muted mt-1">
              No personal data is collected without your consent.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={handleDecline}
            className="font-mono text-[10px] text-hud-muted hover:text-hud-text px-3 py-1.5 rounded border border-hud-border hover:border-hud-muted transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="font-mono text-[10px] text-hud-base font-bold bg-hud-accent hover:bg-hud-accent/90 px-4 py-1.5 rounded transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
