"use client";

import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("worldscope_theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("light-mode", saved === "light");
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
