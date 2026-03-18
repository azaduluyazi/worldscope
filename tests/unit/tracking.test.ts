import { describe, it, expect } from "vitest";
import { fetchVesselPositions } from "@/lib/api/marine-ais";

describe("vessel positions", () => {
  it("returns vessels from maritime hotspots", async () => {
    const vessels = await fetchVesselPositions();
    expect(vessels.length).toBeGreaterThan(0);
    expect(vessels.length).toBeLessThanOrEqual(100);
  });

  it("each vessel has required fields", async () => {
    const vessels = await fetchVesselPositions();
    for (const v of vessels.slice(0, 5)) {
      expect(v.mmsi).toBeTruthy();
      expect(v.name).toBeTruthy();
      expect(v.latitude).toBeGreaterThanOrEqual(-90);
      expect(v.latitude).toBeLessThanOrEqual(90);
      expect(v.longitude).toBeGreaterThanOrEqual(-180);
      expect(v.longitude).toBeLessThanOrEqual(180);
      expect(v.shipType).toBeTruthy();
    }
  });

  it("returns deterministic results within same time window", async () => {
    const a = await fetchVesselPositions();
    const b = await fetchVesselPositions();
    expect(a.length).toBe(b.length);
    expect(a[0].mmsi).toBe(b[0].mmsi);
  });

  it("includes multiple ship types", async () => {
    const vessels = await fetchVesselPositions();
    const types = new Set(vessels.map((v) => v.shipType));
    expect(types.size).toBeGreaterThan(1);
  });
});
