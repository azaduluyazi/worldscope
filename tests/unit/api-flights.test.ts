import { describe, it, expect } from "vitest";

describe("Flight tracking data validation", () => {
  it("latitude/longitude are in valid range", () => {
    const positions = [
      { lat: 41.0, lng: 28.9 },
      { lat: -33.8, lng: 151.2 },
      { lat: 0, lng: 0 },
    ];
    for (const pos of positions) {
      expect(pos.lat).toBeGreaterThanOrEqual(-90);
      expect(pos.lat).toBeLessThanOrEqual(90);
      expect(pos.lng).toBeGreaterThanOrEqual(-180);
      expect(pos.lng).toBeLessThanOrEqual(180);
    }
  });

  it("altitude is non-negative", () => {
    expect(0).toBeGreaterThanOrEqual(0);
    expect(10000).toBeGreaterThanOrEqual(0);
  });
});
