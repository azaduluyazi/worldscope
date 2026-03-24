import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DashboardTheme } from "@/config/themes";

vi.mock("@/components/shared/ThemeProvider", () => ({
  useTheme: vi.fn(),
}));

import { DefconBar } from "@/components/dashboard/DefconBar";
import { useTheme } from "@/components/shared/ThemeProvider";

describe("DefconBar", () => {
  it("renders all 5 threat levels when defconBar is enabled", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: { defconBar: true } as DashboardTheme,
      themeId: "warzone",
      setTheme: vi.fn(),
      themes: [],
    });
    render(<DefconBar activeLevel={0} />);
    expect(screen.getByText("SEVERE")).toBeTruthy();
    expect(screen.getByText("HIGH")).toBeTruthy();
    expect(screen.getByText("ELEVATED")).toBeTruthy();
    expect(screen.getByText("GUARDED")).toBeTruthy();
    expect(screen.getByText("LOW")).toBeTruthy();
  });

  it("returns null when defconBar is disabled", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: { defconBar: false } as DashboardTheme,
      themeId: "military",
      setTheme: vi.fn(),
      themes: [],
    });
    const { container } = render(<DefconBar />);
    expect(container.innerHTML).toBe("");
  });

  it("marks active level with aria-current", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: { defconBar: true } as DashboardTheme,
      themeId: "warzone",
      setTheme: vi.fn(),
      themes: [],
    });
    render(<DefconBar activeLevel={2} />);
    const elevated = screen.getByText("ELEVATED").closest("div");
    expect(elevated?.getAttribute("aria-current")).toBe("true");
  });
});
