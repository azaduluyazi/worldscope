import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IntelCard } from "@/components/dashboard/IntelCard";
import type { IntelItem } from "@/types/intel";

const mockItem: IntelItem = {
  id: "test-1",
  title: "NATO deploys forces to Eastern Europe",
  summary: "Test summary",
  source: "Reuters",
  category: "conflict",
  severity: "critical",
  publishedAt: new Date().toISOString(),
  url: "https://example.com/article",
};

describe("IntelCard", () => {
  it("renders title text", () => {
    render(<IntelCard item={mockItem} />);
    expect(screen.getByText(/NATO deploys/)).toBeTruthy();
  });

  it("shows severity and category label", () => {
    render(<IntelCard item={mockItem} />);
    expect(screen.getByText(/CRITICAL — CONFLICT/)).toBeTruthy();
  });

  it("shows source name", () => {
    render(<IntelCard item={mockItem} />);
    expect(screen.getByText("Reuters")).toBeTruthy();
  });

  it("applies severity CSS class", () => {
    const { container } = render(<IntelCard item={mockItem} />);
    expect(container.querySelector(".severity-critical")).toBeTruthy();
  });

  it("shows geo indicator when lat/lng present", () => {
    const geoItem = { ...mockItem, lat: 41.0, lng: 28.9 };
    render(<IntelCard item={geoItem} />);
    expect(screen.getByText("📍")).toBeTruthy();
  });
});
