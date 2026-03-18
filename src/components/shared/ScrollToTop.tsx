"use client";

import { useState, useEffect, useCallback } from "react";

export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollUp = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={scrollUp}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-hud-accent/20 border border-hud-accent/40 text-hud-accent flex items-center justify-center hover:bg-hud-accent/30 transition-all shadow-lg backdrop-blur-sm"
      title="Scroll to top"
    >
      ↑
    </button>
  );
}
