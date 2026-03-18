/**
 * Inshorts — Short news summaries.
 * Note: Inshorts does not provide a public API.
 * This module exports a no-op placeholder for potential future integration.
 */

import type { IntelItem } from "@/types/intel";

/**
 * Inshorts does not offer a public API.
 * Returns an empty array. If a public endpoint becomes available,
 * this function can be implemented to parse short news summaries.
 */
export async function fetchInshortsNews(): Promise<IntelItem[]> {
  // Inshorts has no public API — returning empty result
  return [];
}
