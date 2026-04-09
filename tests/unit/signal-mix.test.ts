import { describe, it, expect } from "vitest";
import {
  analyzeSignalMix,
  renderSignalMixForTelegram,
  MIGRATION_013_SOURCES,
  type SourceHit,
} from "@/lib/convergence/signal-mix";

/**
 * Signal Mix analyzer tests.
 *
 * The analyzer is a pure function over (sources, counts) so these tests
 * don't mock anything — they just feed it synthetic data and assert the
 * shape of the output report.
 */

describe("analyzeSignalMix", () => {
  it("returns empty-safe report when no events", () => {
    const report = analyzeSignalMix([]);
    expect(report.totalEvents).toBe(0);
    expect(report.totalSources).toBe(0);
    expect(report.anomalies.some((a) => a.code === "NO_EVENTS")).toBe(true);
  });

  it("computes tier distribution with correct percentages", () => {
    const hits: SourceHit[] = [
      { source: "Reuters", count: 50 },          // T1
      { source: "BBC", count: 30 },              // T2
      { source: "Hacker News Top 300+", count: 10 }, // T3
      { source: "Reddit r/worldnews", count: 10 }, // T4
    ];
    const report = analyzeSignalMix(hits);

    expect(report.totalEvents).toBe(100);
    expect(report.tierDistribution.find((t) => t.tier === 1)?.percentage).toBe(50);
    expect(report.tierDistribution.find((t) => t.tier === 2)?.percentage).toBe(30);
    expect(report.tierDistribution.find((t) => t.tier === 4)?.percentage).toBe(10);
    expect(report.socialLayerPct).toBe(10);
  });

  it("flags SOCIAL_LAYER_UNDERCONTRIBUTING when T4 below threshold", () => {
    const hits: SourceHit[] = [
      { source: "Reuters", count: 100 },
      { source: "BBC", count: 50 },
      { source: "Reddit r/worldnews", count: 1 }, // T4 but under 3%
    ];
    const report = analyzeSignalMix(hits);
    expect(
      report.anomalies.some((a) => a.code === "SOCIAL_LAYER_UNDERCONTRIBUTING")
    ).toBe(true);
  });

  it("does NOT flag social layer when above threshold", () => {
    const hits: SourceHit[] = [
      { source: "Reuters", count: 80 },
      { source: "Reddit r/worldnews", count: 20 }, // 20% T4 — healthy
    ];
    const report = analyzeSignalMix(hits);
    expect(
      report.anomalies.some((a) => a.code === "SOCIAL_LAYER_UNDERCONTRIBUTING")
    ).toBe(false);
  });

  it("flags TIER_IMBALANCE when one source dominates", () => {
    const hits: SourceHit[] = [
      { source: "Reuters", count: 500 }, // 83%
      { source: "BBC", count: 50 },
      { source: "Reddit r/worldnews", count: 50 },
    ];
    const report = analyzeSignalMix(hits);
    expect(report.anomalies.some((a) => a.code === "TIER_IMBALANCE")).toBe(true);
  });

  it("flags NEW_SOURCE_ZERO_EVENTS when migration 013 sources missing", () => {
    // Only include a couple of the tracked new sources — most are missing
    const hits: SourceHit[] = [
      { source: "Reuters", count: 100 },
      { source: "Reddit r/worldnews", count: 10 },
      { source: "Hacker News", count: 5 },
    ];
    const report = analyzeSignalMix(hits);

    const zeroAnomaly = report.anomalies.find((a) => a.code === "NEW_SOURCE_ZERO_EVENTS");
    expect(zeroAnomaly).toBeDefined();
    expect(zeroAnomaly!.severity).toBe("critical"); // missing count ≥ 5 threshold
    // Only 2 of the tracked sources are present, so the rest should be flagged
    expect(zeroAnomaly!.sources?.length).toBe(MIGRATION_013_SOURCES.length - 2);
  });

  it("marks all migration 013 sources as healthy when all present", () => {
    const hits: SourceHit[] = MIGRATION_013_SOURCES.map((source) => ({
      source,
      count: 5,
    }));
    // Add enough volume so the new sources aren't 100% of events
    hits.push({ source: "Reuters", count: 1000 });

    const report = analyzeSignalMix(hits);
    const healthy = report.newSourceStatus.filter((s) => s.status === "healthy");
    expect(healthy.length).toBe(MIGRATION_013_SOURCES.length);
  });

  it("reports top sources sorted by count descending", () => {
    const hits: SourceHit[] = [
      { source: "Reuters", count: 50 },
      { source: "BBC", count: 100 },
      { source: "AP", count: 25 },
    ];
    const report = analyzeSignalMix(hits);
    expect(report.topSources[0].source).toBe("BBC");
    expect(report.topSources[1].source).toBe("Reuters");
    expect(report.topSources[2].source).toBe("AP");
  });
});

describe("renderSignalMixForTelegram", () => {
  it("includes totals, tier breakdown, and anomaly summary", () => {
    const hits: SourceHit[] = [
      { source: "Reuters", count: 100 },
      { source: "Reddit r/worldnews", count: 10 }, // ~9% T4 — healthy
      { source: "Hacker News", count: 5 },
    ];
    const report = analyzeSignalMix(hits, 24);
    const text = renderSignalMixForTelegram(report);

    expect(text).toContain("WorldScope Signal Mix");
    expect(text).toContain("115 events");
    expect(text).toContain("Tier distribution");
    // Most migration-013 sources are missing in this test data
    expect(text).toContain("anomal");
  });

  it("says 'No anomalies' when everything is healthy", () => {
    // All 19 migration sources present, plus several T1/T2 sources
    // spread thin enough that no single source exceeds 25%.
    const hits: SourceHit[] = MIGRATION_013_SOURCES.map((source) => ({
      source,
      count: 30, // total T4/T3/T2 from migration = 19 × 30 = 570
    }));
    // Add T1 wire sources — each below 25% single-source threshold
    hits.push({ source: "Reuters", count: 80 });
    hits.push({ source: "BBC", count: 80 });
    hits.push({ source: "AP", count: 80 });
    hits.push({ source: "AFP", count: 80 });
    // Grand total: 890, top source = 80/890 = 9% (well under 25%)

    const report = analyzeSignalMix(hits);
    const text = renderSignalMixForTelegram(report);
    expect(text).toContain("No anomalies");
  });
});
