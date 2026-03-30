"use client";

import { useState, useEffect } from "react";

export function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    // Don't show if already dismissed or subscribed
    if (localStorage.getItem("ws-newsletter-dismissed")) return;
    if (localStorage.getItem("ws-newsletter-subscribed")) return;

    // Track page views
    const views = parseInt(localStorage.getItem("ws-page-views") || "0", 10) + 1;
    localStorage.setItem("ws-page-views", String(views));

    // Show after 3 page views
    if (views >= 3) {
      const timer = setTimeout(() => setShow(true), 2000); // 2s delay
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency: "daily" }),
      });
      if (res.ok) {
        setStatus("success");
        localStorage.setItem("ws-newsletter-subscribed", "true");
        setTimeout(() => setShow(false), 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("ws-newsletter-dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-hud-panel border border-hud-accent/30 rounded-lg shadow-2xl p-4 animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-hud-muted hover:text-hud-text text-sm"
      >
        ✕
      </button>
      <div className="font-mono text-[10px] text-hud-accent tracking-wider uppercase mb-1">
        📡 Intelligence Briefing
      </div>
      <p className="font-mono text-[11px] text-hud-text mb-3">
        Get daily intelligence summaries delivered to your inbox.
      </p>
      {status === "success" ? (
        <div className="font-mono text-[10px] text-green-400">✓ Subscribed! Check your email.</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 bg-hud-base border border-hud-border rounded px-2 py-1.5 font-mono text-[10px] text-hud-text placeholder:text-hud-muted/50 focus:border-hud-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-3 py-1.5 bg-hud-accent/20 border border-hud-accent/50 rounded font-mono text-[9px] text-hud-accent hover:bg-hud-accent/30 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && (
        <div className="font-mono text-[9px] text-red-400 mt-1">Failed. Try again.</div>
      )}
    </div>
  );
}
