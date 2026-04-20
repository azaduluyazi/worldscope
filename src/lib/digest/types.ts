/**
 * Shared types for the multi-channel digest delivery layer.
 *
 * One brief renders into the same DigestItem[] shape, then each channel
 * adapter (slack / discord / telegram / webhook / email) serializes it
 * to the destination's native payload shape.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface DigestItem {
  /** Short, tweetable title. Adapters may truncate further. */
  title: string;
  severity: Severity;
  /** ISO timestamp of publish. */
  publishedAt?: string;
  /** Upstream source name (e.g. "Reuters", "CISA"). */
  source?: string;
  /** Canonical URL to the item. Optional. */
  url?: string;
  /** ISO 3166-1 alpha-2 country code. Optional. */
  country?: string;
  /** One of the 11 pantheon variant ids (world/ares/hermes/…). Optional. */
  category?: string;
  /** Convergence score (0-100). Higher = hotter. Optional. */
  score?: number;
  /** Single-sentence AI summary. Optional. */
  summary?: string;
}

export interface DigestMeta {
  /** Header title — "WorldScope Daily · 2026-04-20" etc. */
  title?: string;
  /** Short prose situation assessment displayed above the item list. */
  assessment?: string;
  /** Rendering brand link back to the site. */
  brandUrl?: string;
  /** Optional footer signed by the tier (Chora / Pleiades / Gaia / Prometheus). */
  tier?: string;
}

export interface DispatchResult {
  channel: string;
  ok: boolean;
  status?: number;
  error?: string;
}
