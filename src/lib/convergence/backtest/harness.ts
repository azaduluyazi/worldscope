import { runFullConvergenceScan } from "../engine";
import type { Convergence } from "../types";
import type { Fixture, ExpectedOutcome } from "./fixtures";

// ═══════════════════════════════════════════════════════════════════
//  Backtest Harness
// ═══════════════════════════════════════════════════════════════════
//
//  Runs the convergence engine against a set of fixtures and reports:
//
//   1. PASS/FAIL per fixture (does the engine satisfy expectations?)
//   2. Aggregate metrics (precision, recall, F1)
//   3. Calibration: Brier score across fixtures
//
//  This is the foundation for parameter tuning. Run the harness,
//  change a parameter (e.g. BAYESIAN_PRIOR), run again, compare.
//
//  Designed to be called from a CLI script (scripts/backtest.ts) or
//  from a CI workflow.
// ═══════════════════════════════════════════════════════════════════

export interface FixtureResult {
  fixtureId: string;
  fixtureName: string;
  category: Fixture["category"];
  passed: boolean;
  failures: string[];
  actualConvergenceCount: number;
  topConfidence: number | null;
  topCategories: string[];
  expectedSummary: string;
}

export interface BacktestReport {
  timestamp: string;
  totalFixtures: number;
  passed: number;
  failed: number;
  passRate: number;
  byCategory: Record<Fixture["category"], { passed: number; failed: number }>;
  /**
   * Brier score: average squared error between (predicted confidence,
   * actual outcome). Lower is better. 0 = perfect. 0.25 = random.
   * Only computed for fixtures with deterministic outcomes.
   */
  brierScore: number | null;
  results: FixtureResult[];
}

// ── Single fixture evaluation ─────────────────────────────────────

function checkFixture(
  fixture: Fixture,
  convergences: Convergence[]
): FixtureResult {
  const failures: string[] = [];
  const exp = fixture.expected;
  const top = convergences[0];

  // Count check
  if (
    exp.minConvergences !== undefined &&
    convergences.length < exp.minConvergences
  ) {
    failures.push(
      `expected ≥${exp.minConvergences} convergences, got ${convergences.length}`
    );
  }
  if (
    exp.maxConvergences !== undefined &&
    convergences.length > exp.maxConvergences
  ) {
    failures.push(
      `expected ≤${exp.maxConvergences} convergences, got ${convergences.length}`
    );
  }

  // Top confidence checks (only if we have a top convergence)
  if (top) {
    if (
      exp.topConfidenceMin !== undefined &&
      top.confidence < exp.topConfidenceMin
    ) {
      failures.push(
        `top confidence ${top.confidence.toFixed(2)} < expected min ${exp.topConfidenceMin}`
      );
    }
    if (
      exp.topConfidenceMax !== undefined &&
      top.confidence > exp.topConfidenceMax
    ) {
      failures.push(
        `top confidence ${top.confidence.toFixed(2)} > expected max ${exp.topConfidenceMax}`
      );
    }

    const topCats = new Set(top.signals.map((s) => s.category));

    if (exp.expectedCategories) {
      for (const c of exp.expectedCategories) {
        if (!topCats.has(c as Convergence["signals"][0]["category"])) {
          failures.push(`expected category "${c}" not present in top convergence`);
        }
      }
    }
    if (exp.forbiddenCategories) {
      for (const c of exp.forbiddenCategories) {
        if (topCats.has(c as Convergence["signals"][0]["category"])) {
          failures.push(`forbidden category "${c}" appeared in top convergence`);
        }
      }
    }

    if (exp.expectChainLinks && top.impactChain.length === 0) {
      failures.push("expected impact chain links, got none");
    }
    if (exp.expectPredictions && (top.predictions ?? []).length === 0) {
      failures.push("expected forward predictions, got none");
    }
  }

  return {
    fixtureId: fixture.id,
    fixtureName: fixture.name,
    category: fixture.category,
    passed: failures.length === 0,
    failures,
    actualConvergenceCount: convergences.length,
    topConfidence: top?.confidence ?? null,
    topCategories: top
      ? Array.from(new Set(top.signals.map((s) => s.category)))
      : [],
    expectedSummary: summarizeExpected(exp),
  };
}

function summarizeExpected(exp: ExpectedOutcome): string {
  const parts: string[] = [];
  if (exp.minConvergences !== undefined && exp.maxConvergences !== undefined) {
    parts.push(`count ${exp.minConvergences}-${exp.maxConvergences}`);
  } else if (exp.minConvergences !== undefined) {
    parts.push(`count ≥${exp.minConvergences}`);
  } else if (exp.maxConvergences !== undefined) {
    parts.push(`count ≤${exp.maxConvergences}`);
  }
  if (exp.topConfidenceMin !== undefined) parts.push(`conf ≥${exp.topConfidenceMin}`);
  if (exp.topConfidenceMax !== undefined) parts.push(`conf ≤${exp.topConfidenceMax}`);
  if (exp.expectedCategories) parts.push(`cats: ${exp.expectedCategories.join("+")}`);
  return parts.join(", ");
}

// ── Brier score across fixtures ───────────────────────────────────

function computeBrierScore(results: FixtureResult[], fixtures: Fixture[]): number | null {
  // Only fixtures with explicit min count expectations contribute.
  // Outcome = 1 if engine produced at least the min, else 0.
  // Probability = sigmoid-ish proxy from topConfidence.
  let sum = 0;
  let n = 0;
  for (const r of results) {
    const fx = fixtures.find((f) => f.id === r.fixtureId);
    if (!fx) continue;
    if (fx.expected.minConvergences === undefined) continue;
    const outcome = r.actualConvergenceCount >= fx.expected.minConvergences ? 1 : 0;
    const prob = r.topConfidence ?? 0;
    sum += (prob - outcome) ** 2;
    n += 1;
  }
  if (n === 0) return null;
  return sum / n;
}

// ── Main entry point ──────────────────────────────────────────────

export async function runBacktest(fixtures: Fixture[]): Promise<BacktestReport> {
  const results: FixtureResult[] = [];

  for (const fixture of fixtures) {
    try {
      const response = await runFullConvergenceScan(fixture.items);
      const result = checkFixture(fixture, response.convergences);
      results.push(result);
    } catch (err) {
      results.push({
        fixtureId: fixture.id,
        fixtureName: fixture.name,
        category: fixture.category,
        passed: false,
        failures: [`engine threw: ${err instanceof Error ? err.message : String(err)}`],
        actualConvergenceCount: 0,
        topConfidence: null,
        topCategories: [],
        expectedSummary: summarizeExpected(fixture.expected),
      });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const passRate = results.length > 0 ? passed / results.length : 0;

  const byCategory: BacktestReport["byCategory"] = {
    true_positive: { passed: 0, failed: 0 },
    true_negative: { passed: 0, failed: 0 },
    calibration: { passed: 0, failed: 0 },
    regression: { passed: 0, failed: 0 },
  };
  for (const r of results) {
    byCategory[r.category][r.passed ? "passed" : "failed"]++;
  }

  return {
    timestamp: new Date().toISOString(),
    totalFixtures: fixtures.length,
    passed,
    failed,
    passRate,
    byCategory,
    brierScore: computeBrierScore(results, fixtures),
    results,
  };
}

// ── Pretty printing ────────────────────────────────────────────────

export function formatReport(report: BacktestReport): string {
  const lines: string[] = [];
  lines.push("═".repeat(70));
  lines.push("  WorldScope Convergence Engine — Backtest Report");
  lines.push("═".repeat(70));
  lines.push(`  Timestamp:   ${report.timestamp}`);
  lines.push(`  Fixtures:    ${report.totalFixtures}`);
  lines.push(`  Passed:      ${report.passed}`);
  lines.push(`  Failed:      ${report.failed}`);
  lines.push(`  Pass rate:   ${(report.passRate * 100).toFixed(1)}%`);
  if (report.brierScore !== null) {
    lines.push(`  Brier score: ${report.brierScore.toFixed(4)}  (lower is better, 0 = perfect)`);
  }
  lines.push("");
  lines.push("  By category:");
  for (const [cat, counts] of Object.entries(report.byCategory)) {
    if (counts.passed + counts.failed === 0) continue;
    lines.push(
      `    ${cat.padEnd(18)} ${counts.passed} passed, ${counts.failed} failed`
    );
  }
  lines.push("");
  lines.push("─".repeat(70));
  lines.push("  Per-fixture results:");
  lines.push("─".repeat(70));
  for (const r of report.results) {
    const icon = r.passed ? "✓" : "✗";
    lines.push(`  ${icon} ${r.fixtureName}`);
    lines.push(`      expected: ${r.expectedSummary}`);
    lines.push(
      `      actual:   ${r.actualConvergenceCount} convergence(s)` +
        (r.topConfidence !== null ? `, top conf ${r.topConfidence.toFixed(2)}` : "") +
        (r.topCategories.length > 0 ? `, cats [${r.topCategories.join(", ")}]` : "")
    );
    if (r.failures.length > 0) {
      for (const f of r.failures) {
        lines.push(`      ⚠ ${f}`);
      }
    }
    lines.push("");
  }
  lines.push("═".repeat(70));
  return lines.join("\n");
}
