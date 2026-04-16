/**
 * Entity persistence — Palantir-style ontology layer.
 * Writes/reads canonical entity records and their event linkages.
 * Consumed by the fetch-feeds cron (via entity-pipeline.ts),
 * /entity/[slug] pages, and the co-occurrence graph.
 */

import { createServerClient } from "./supabase";
import type { ExtractedEntity } from "@/lib/nlp/entity-extraction";

export interface Entity {
  id: number;
  slug: string;
  name: string;
  type: "person" | "organization" | "country" | "topic";
  aliases: string[];
  first_seen: string;
  last_seen: string;
  mention_count: number;
  metadata: Record<string, unknown>;
}

/**
 * URL-safe slug for an entity name. Handles Turkish chars explicitly
 * (Türkiye → turkiye) since the default NFD normalize can't map ı/İ
 * correctly on its own.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/gi, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Upsert an entity by slug. If it already exists, mention_count is
 * incremented and last_seen is refreshed — the atomic logic lives in
 * the Postgres upsert_entity() RPC (migration 018).
 */
export async function upsertEntity(extracted: ExtractedEntity): Promise<Entity> {
  const slug = slugify(extracted.name);
  if (!slug) throw new Error(`upsertEntity: slugify produced empty slug for "${extracted.name}"`);
  const db = createServerClient();
  const { data, error } = await db.rpc("upsert_entity", {
    p_slug: slug,
    p_name: extracted.name,
    p_type: extracted.type,
  });
  if (error) throw new Error(`upsertEntity failed: ${error.message}`);
  return data as Entity;
}

/**
 * Link a batch of entities to a single event. Idempotent — re-calling
 * with the same (event_id, entity_id) pair is a no-op via upsert.
 */
export async function linkEntitiesToEvent(
  eventId: string,
  entities: Array<{ entityId: number; confidence: number }>
): Promise<void> {
  if (entities.length === 0) return;
  const rows = entities.map((e) => ({
    event_id: eventId,
    entity_id: e.entityId,
    confidence: e.confidence,
  }));
  const db = createServerClient();
  const { error } = await db
    .from("story_entities")
    .upsert(rows, { onConflict: "event_id,entity_id" });
  if (error) throw new Error(`linkEntitiesToEvent failed: ${error.message}`);
}

export async function getEntityBySlug(slug: string): Promise<Entity | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from("entities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return (data as Entity | null) ?? null;
}

export async function getEventsForEntity(
  entityId: number,
  limit = 50
): Promise<Array<{ event_id: string; created_at: string; confidence: number }>> {
  const db = createServerClient();
  const { data, error } = await db
    .from("story_entities")
    .select("event_id, created_at, confidence")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getEventsForEntity: ${error.message}`);
  return (data ?? []) as Array<{
    event_id: string;
    created_at: string;
    confidence: number;
  }>;
}

export async function getTopEntities(
  type: Entity["type"] | null = null,
  limit = 50
): Promise<Entity[]> {
  const db = createServerClient();
  let query = db
    .from("entities")
    .select("*")
    .order("mention_count", { ascending: false })
    .limit(limit);
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw new Error(`getTopEntities: ${error.message}`);
  return (data ?? []) as Entity[];
}
