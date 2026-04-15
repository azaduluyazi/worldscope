"use client";

import { useState } from "react";

/**
 * BriefingSignupForm — Single-field, high-conversion email capture.
 *
 * Used on /briefing landing page and can be reused anywhere. Tracks
 * `source` so we can attribute sign-ups to the page that drove them.
 */

interface Props {
  source?: string;
  compact?: boolean;
}

const SUBSCRIBED_KEY = "ws-newsletter-subscribed";

export function BriefingSignupForm({
  source = "briefing",
  compact = false,
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency: "weekly", source }),
      });
      if (res.ok) {
        setStatus("success");
        if (typeof window !== "undefined") {
          localStorage.setItem(SUBSCRIBED_KEY, "true");
        }
      } else {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error || "Subscription failed");
        setStatus("error");
      }
    } catch {
      setError("Network error — please try again");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className={`border border-hud-accent/50 bg-hud-accent/10 rounded-lg ${
          compact ? "p-3" : "p-6"
        } text-center`}
      >
        <div className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-1">
          ✓ CONFIRMED
        </div>
        <div className="font-mono text-xs md:text-sm text-hud-text">
          Check your inbox. First Sunday Convergence Report arrives on the
          next Sunday at 07:00 UTC.
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}
      data-source={source}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor={`briefing-email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`briefing-email-${source}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoComplete="email"
          className={`flex-1 bg-hud-panel/80 border border-hud-border rounded px-4 ${
            compact ? "py-2 text-xs" : "py-3 text-sm"
          } font-mono text-hud-text placeholder:text-hud-muted/60 focus:border-hud-accent focus:outline-none focus:ring-1 focus:ring-hud-accent/40 transition-colors`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          lang="en"
          className={`${
            compact ? "px-4 py-2 text-xs" : "px-6 py-3 text-sm"
          } bg-hud-accent text-hud-base font-mono font-bold tracking-wider rounded hover:bg-hud-accent/80 transition-colors disabled:opacity-50 whitespace-nowrap`}
        >
          {status === "loading" ? "..." : "GET IT SUNDAY"}
        </button>
      </div>
      {status === "error" && error && (
        <div className="font-mono text-[10px] text-red-400">{error}</div>
      )}
    </form>
  );
}
