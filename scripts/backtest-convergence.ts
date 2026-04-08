#!/usr/bin/env tsx
/**
 * CLI runner for the convergence engine backtest harness.
 *
 * Usage:
 *   npm run backtest:convergence
 *
 * Runs all fixtures in src/lib/convergence/backtest/fixtures.ts and
 * prints a summary report to stdout. Exits with code 1 if any
 * fixtures fail (so CI can catch regressions).
 */

import { FIXTURES } from "../src/lib/convergence/backtest/fixtures";
import {
  formatReport,
  runBacktest,
} from "../src/lib/convergence/backtest/harness";

async function main() {
  console.log("Running convergence backtest...");
  console.log(`Fixtures: ${FIXTURES.length}`);
  console.log("");

  const report = await runBacktest(FIXTURES);
  console.log(formatReport(report));

  if (report.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Backtest crashed:", err);
  process.exit(2);
});
