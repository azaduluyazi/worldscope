"use client";

import { useState, useCallback, useEffect } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  // Always start with "dark" to match SSR output. React hydration #418
  // previously fired here when a user with a saved "light" preference
  // rendered a different emoji on client than server. The saved theme is
  // applied post-hydration in the effect below.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("worldscope_theme") as Theme | null;
    if (saved === "light") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme("light");
      document.documentElement.classList.toggle("light-mode", true);
    }
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("worldscope_theme", next);
    document.documentElement.classList.toggle("light-mode", next === "light");
  }, [theme]);

  return (
    <button
      onClick={toggle}
      className="w-7 h-7 rounded-md bg-hud-panel border border-hud-border flex items-center justify-center text-sm hover:border-hud-muted transition-all"
      title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
