import { describe, expect, it } from "vitest";
import { getGroupsForSource } from "../source-syndication";

// ═══════════════════════════════════════════════════════════════════
//  Independence Invariants
// ═══════════════════════════════════════════════════════════════════
//
//  This file asserts DESIGN DECISIONS that we deliberately made when
//  building the syndication groups. These are not "bugs to test" —
//  they are properties we want to GUARANTEE never accidentally regress.
//
//  When you're tempted to add a source to a group, run this test
//  first. If it fails, you're about to break a known-good invariant.
//
// ═══════════════════════════════════════════════════════════════════

describe("syndication independence invariants", () => {
  it("kandilli is NOT grouped with USGS (independent corroboration)", () => {
    const groups = getGroupsForSource("kandilli");
    const usgsGroup = groups.find((g) => g.id === "usgs-earthquake-catalog");
    expect(usgsGroup).toBeUndefined();
  });

  it("eia is NOT grouped with European energy feeds", () => {
    const groups = getGroupsForSource("eia");
    const euGroup = groups.find((g) => g.id === "european-energy-grid");
    expect(euGroup).toBeUndefined();
  });

  it("hibp-breaches is fully independent (no groups)", () => {
    expect(getGroupsForSource("hibp-breaches")).toEqual([]);
  });

  it("pubmed is NOT grouped with WHO (research vs policy)", () => {
    const groups = getGroupsForSource("pubmed");
    const whoGroup = groups.find((g) => g.id === "health-monitoring");
    expect(whoGroup).toBeUndefined();
  });

  it("safecast is fully independent (citizen science)", () => {
    expect(getGroupsForSource("safecast")).toEqual([]);
  });

  it("oref is fully independent (Israel military alerts)", () => {
    expect(getGroupsForSource("oref")).toEqual([]);
  });

  it("space-weather is fully independent", () => {
    expect(getGroupsForSource("space-weather")).toEqual([]);
  });

  it("gbif is fully independent", () => {
    expect(getGroupsForSource("gbif")).toEqual([]);
  });

  it("USGS feeds are all in the SAME group", () => {
    const u1 = getGroupsForSource("usgs-4.5w");
    const u2 = getGroupsForSource("usgs-2.5d");
    const u3 = getGroupsForSource("usgs-sig-month");
    expect(u1.length).toBeGreaterThan(0);
    expect(u1[0].id).toBe(u2[0].id);
    expect(u2[0].id).toBe(u3[0].id);
  });

  it("crypto exchanges are all in the SAME group", () => {
    const ex = ["binance-ticker", "coinbase-rates", "crypto-convert", "freeforex"];
    const groupIds = ex.map((s) => getGroupsForSource(s)[0]?.id);
    expect(new Set(groupIds).size).toBe(1);
  });
});
