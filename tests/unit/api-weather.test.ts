import { describe, it, expect } from "vitest";

describe("Weather extreme detection logic", () => {
  const isExtreme = (code: number, temp: number, wind: number) =>
    code >= 95 || temp > 45 || temp < -30 || wind > 80;

  it("WMO code >= 95 is extreme", () => { expect(isExtreme(95, 20, 10)).toBe(true); });
  it("temperature > 45C is extreme", () => { expect(isExtreme(0, 50, 10)).toBe(true); });
  it("temperature < -30C is extreme", () => { expect(isExtreme(0, -35, 10)).toBe(true); });
  it("wind > 80 km/h is extreme", () => { expect(isExtreme(0, 20, 90)).toBe(true); });
  it("normal conditions are not extreme", () => { expect(isExtreme(0, 20, 10)).toBe(false); });
});
