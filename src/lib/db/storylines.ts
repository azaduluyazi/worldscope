import { createServerClient } from "./supabase";
import type { Storyline } from "@/lib/convergence/storyline";
import type { Convergence } from "@/lib/convergence/types";

// ═══════════════════════════════════════════════════════════════════
//  Storylines repository (Supabase)
// ═══════════════════════════════════════════════════════════════════
//
//  Persistence layer for the storyline tracker. The convergence
//  matching/merging math lives in src/lib/convergence/storyline.ts.
//  This file ONLY handles read/write to the convergence_storylines
//  table created in migration 009.
//
// ═══════════════════════════════════════════════════════════════════

const TABLE = "convergence_storylines";

interface StorylineRow {
  id: string;
  type: string;
  peak_confidence: number;
  snapshots: Convergence[];
  centroid_lat: number;
  centroid_lng: number;
  categories: string[];
  affected_regions: string[];
  headline: string;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  archived: boolean;
}

function rowToStoryline(row: StorylineRow): Storyline {
  return {
    id: row.id,
    type: row.type,
    peakConfidence: Number(row.peak_confidence),
    snapshots: row.snapshots ?? [],
    centroid: { lat: Number(row.centroid_lat), lng: Number(row.centroid_lng) },
    categories: row.categories ?? [],
    affectedRegions: row.affected_regions ?? [],
    headline: row.headline,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at,
  };
}

function storylineToRow(s: Storyline): StorylineRow {
  return {
    id: s.id,
    type: s.type,
    peak_confidence: s.peakConfidence,
    snapshots: s.snapshots,
    centroid_lat: s.centroid.lat,
    centroid_lng: s.centroid.lng,
    categories: s.categories,
    affected_regions: s.affectedRegions,
    headline: s.headline,
    created_at: s.createdAt,
    last_activity_at: s.lastActivityAt,
    expires_at: s.expiresAt,
    archived: false,
  };
}

/**
 * Fetch all storylines that haven't expired yet, ordered by recency.
 * Used by the engine to find candidates for convergence attachment.
 */
export async function fetchActiveStorylines(limit: number = 50): Promise<Storyline[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("archived", false)
      .gt("expires_at", new Date().toISOString())
      .order("last_activity_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[storylines.fetchActive] error:", error);
      return [];
    }
    return (data ?? []).map(rowToStoryline);
  } catch (err) {
    console.error("[storylines.fetchActive] exception:", err);
    return [];
  }
}

/**
 * Upsert a storyline (create or update). Used by the engine after
 * either creating a new storyline or attaching to an existing one.
 */
export async function upsertStoryline(storyline: Storyline): Promise<void> {
  try {
    const supabase = createServerClient();
    const row = storylineToRow(storyline);
    const { error } = await supabase
      .from(TABLE)
      .upsert(row, { onConflict: "id" });
    if (error) {
      console.error("[storylines.upsert] error:", error);
    }
  } catch (err) {
    console.error("[storylines.upsert] exception:", err);
  }
}

/**
 * Mark expired storylines as archived. Called from the cron route to
 * keep the active table small and queries fast.
 */
export async function archiveExpired(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("archive_expired_storylines");
    if (error) {
      console.error("[storylines.archiveExpired] error:", error);
      return 0;
    }
    return Number(data ?? 0);
  } catch (err) {
    console.error("[storylines.archiveExpired] exception:", err);
    return 0;
  }
}

/**
 * Fetch a single storyline by ID. Used by the storylines API endpoint
 * for storyline detail views.
 */
export async function fetchStorylineById(id: string): Promise<Storyline | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return rowToStoryline(data);
  } catch (err) {
    console.error("[storylines.fetchById] exception:", err);
    return null;
  }
}
