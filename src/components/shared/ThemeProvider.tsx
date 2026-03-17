"use client";

import { createContext, useContext, type ReactNode } from "react";

const ThemeContext = createContext({ theme: "dark" });

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: "dark" }}>
      <div className="dark">{children}</div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
