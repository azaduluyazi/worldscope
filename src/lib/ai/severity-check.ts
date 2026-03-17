import { generateObject } from "ai";
import { briefModel } from "./providers";
import { z } from "zod";
import type { IntelItem, Severity } from "@/types/intel";

const SeverityCheckResult = z.object({
  corrections: z.array(
    z.object({
      index: z.number(),
      corrected: z.enum(["critical", "high", "medium", "low", "info"]),
      reason: z.string().max(80),
    })
  ),
});

/**
 * AI double-check of severity classifications.
 * Only runs on critical/high items to validate they deserve that rating.
 * Returns corrections for misclassified items.
 */
export async function checkSeverityClassifications(
  items: IntelItem[]
): Promise<Map<number, { severity: Severity; reason: string }>> {
  const corrections = new Map<number, { severity: Severity; reason: string }>();

  // Only check critical and high items — they're most impactful if wrong
  const toCheck = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.severity === "critical" || item.severity === "high")
    .slice(0, 20); // Max 20 items per check

  if (toCheck.length === 0) return corrections;

  const prompt = toCheck
    .map(
      ({ item, index }) =>
        `[${index}] severity=${item.severity} | "${item.title}" (${item.source})`
    )
    .join("\n");

  try {
    const { object } = await generateObject({
      model: briefModel,
      schema: SeverityCheckResult,
      prompt: `Review these news items classified as CRITICAL or HIGH severity. For items that are MISCLASSIFIED (e.g., press releases, routine reports, academic content, or non-urgent news marked as critical/high), provide a correction. Only include items that need correction — skip items that are correctly classified.

Severity guide:
- CRITICAL: Active attacks, mass casualties, nuclear events, breaking emergencies
- HIGH: Escalations, bombings, cyberattacks, emergency declarations
- MEDIUM: Threats, conflicts, protests, vulnerabilities
- LOW: Routine news, trade talks, appointments
- INFO: Background, analysis, reports

${prompt}`,
    });

    for (const correction of object.corrections) {
      corrections.set(correction.index, {
        severity: correction.corrected as Severity,
        reason: correction.reason,
      });
    }
  } catch {
    // AI check is optional — regex classification is the fallback
  }

  return corrections;
}
