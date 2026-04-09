import { describe, expect, it } from "vitest";
import {
  classifyTopicFailure,
  classifyGeoFailure,
  emptyTopicMetrics,
  emptyGeoMetrics,
} from "../track-metrics";

// ═══════════════════════════════════════════════════════════════════
//  track-metrics classifier tests
// ═══════════════════════════════════════════════════════════════════
//
//  These functions are the "one-liner root cause" layer. When the
//  convergence cron writes a row to convergence_metrics, the
//  failure_reason column has to be immediately readable to a human
//  without running any join queries. These tests pin each reason to
//  a specific counter pattern.
// ═══════════════════════════════════════════════════════════════════

describe("classifyTopicFailure", () => {
  it("returns 'no_input' when the detector saw no events at all", () => {
    expect(
      classifyTopicFailure({
        eventsInput: 0,
        eventsWithEmbedding: 0,
        clustersDroppedMinSize: 0,
        clustersDroppedSingleCategory: 0,
      })
    ).toBe("no_input");
  });

  it("returns 'embedding_down' when most events failed to embed", () => {
    // 842 social events, only 100 embedded → ~88% missing
    expect(
      classifyTopicFailure({
        eventsInput: 842,
        eventsWithEmbedding: 100,
        clustersDroppedMinSize: 0,
        clustersDroppedSingleCategory: 0,
      })
    ).toBe("embedding_down");
  });

  it("returns 'embedding_down' for the exact 50% threshold edge", () => {
    // With 10 events and 5 embedded: 5 < ceil(10/2)=5 is false,
    // so NOT embedding_down. Sliding down to 4 DOES trip it.
    expect(
      classifyTopicFailure({
        eventsInput: 10,
        eventsWithEmbedding: 4,
        clustersDroppedMinSize: 0,
        clustersDroppedSingleCategory: 0,
      })
    ).toBe("embedding_down");
  });

  it("returns 'filtered_out' when clusters existed but were dropped", () => {
    // All 100 events embedded, but every cluster was too small or
    // single-category → we DID find pairs, we just filtered them.
    expect(
      classifyTopicFailure({
        eventsInput: 100,
        eventsWithEmbedding: 100,
        clustersDroppedMinSize: 3,
        clustersDroppedSingleCategory: 7,
      })
    ).toBe("filtered_out");
  });

  it("returns 'no_pairs' when everything embedded but no pairs met the threshold", () => {
    // All embedded, zero dropped by filters, still zero clusters →
    // no pair passed the similarity + time window predicate.
    expect(
      classifyTopicFailure({
        eventsInput: 100,
        eventsWithEmbedding: 100,
        clustersDroppedMinSize: 0,
        clustersDroppedSingleCategory: 0,
      })
    ).toBe("no_pairs");
  });
});

describe("classifyGeoFailure", () => {
  it("returns 'no_input' for zero geo-tagged events", () => {
    expect(
      classifyGeoFailure({
        eventsInput: 0,
        geoClustersFound: 0,
        temporalGroupsFound: 0,
      })
    ).toBe("no_input");
  });

  it("returns 'no_pairs' when input events failed to cluster geographically", () => {
    expect(
      classifyGeoFailure({
        eventsInput: 131,
        geoClustersFound: 0,
        temporalGroupsFound: 0,
      })
    ).toBe("no_pairs");
  });

  it("returns 'filtered_out' when geo clusters existed but no temporal groups", () => {
    expect(
      classifyGeoFailure({
        eventsInput: 131,
        geoClustersFound: 12,
        temporalGroupsFound: 0,
      })
    ).toBe("filtered_out");
  });
});

describe("empty factories", () => {
  it("emptyTopicMetrics produces a zeroed topic snapshot", () => {
    const m = emptyTopicMetrics();
    expect(m.track).toBe("topic");
    expect(m.eventsInput).toBe(0);
    expect(m.clustersProduced).toBe(0);
    expect(m.failureReason).toBeNull();
    expect(m.eventsWithEmbedding).toBe(0);
  });

  it("emptyGeoMetrics produces a zeroed geo snapshot", () => {
    const m = emptyGeoMetrics();
    expect(m.track).toBe("geo");
    expect(m.eventsInput).toBe(0);
    expect(m.geoClustersFound).toBe(0);
    expect(m.temporalGroupsFound).toBe(0);
  });
});
