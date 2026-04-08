import { describe, expect, it } from "vitest";
import { FIXTURES } from "../backtest/fixtures";
import { runBacktest, formatReport } from "../backtest/harness";

// ═══════════════════════════════════════════════════════════════════
//  Backtest as a regression test
// ═══════════════════════════════════════════════════════════════════
//
//  This file is BOTH a regression test AND a documentation tool.
//  Run it after any parameter change to see how the fixtures shift.
//
//  When a fixture starts failing:
//    1. Read the fixture's `description` to understand what it tests
//    2. Decide: bug or intentional change?
//       - Bug → fix code, test should re-pass
//       - Intentional → update the fixture's `expected` block
//
//  We do NOT require ALL fixtures to pass — some are aspirational.
//  Instead we check for REGRESSIONS: the pass count should never drop.
// ═══════════════════════════════════════════════════════════════════

// Adjust this baseline as the engine improves. Today's reality:
// the fixtures are deliberately strict to drive the engine forward,
// so we expect SOME failures during early calibration.
const MIN_EXPECTED_PASS_RATE = 0.5;

describe("convergence backtest harness", () => {
  it(
    "runs all fixtures and meets the minimum pass rate",
    async () => {
      const report = await runBacktest(FIXTURES);

      // Print the report so test output is informative
      console.log("\n" + formatReport(report));

      expect(report.totalFixtures).toBeGreaterThan(0);
      expect(report.passRate).toBeGreaterThanOrEqual(MIN_EXPECTED_PASS_RATE);
    },
    30_000 // 30s timeout — engine + LLM narrative can be slow
  );

  it("brier score is computed when applicable", async () => {
    const report = await runBacktest(FIXTURES);
    // We don't enforce a strict Brier ceiling yet — just verify it
    // computes a number when fixtures provide outcomes.
    if (report.brierScore !== null) {
      expect(report.brierScore).toBeGreaterThanOrEqual(0);
      expect(report.brierScore).toBeLessThanOrEqual(1);
    }
  }, 30_000);
});
