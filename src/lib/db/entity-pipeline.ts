/**
 * Entity extraction pipeline — runs inside the existing fetch-feeds cron
 * after persistEvents() returns. Designed to:
 *   - reuse the rule-based NER in src/lib/nlp/entity-extraction.ts (zero LLM cost)
 *   - tolerate per-event failures (logged, counted, skipped)
 *   - stay under the cron's 300s maxDuration even with full FEED_LIMIT batches
 *
 * NOTE: event IDs passed in here should be raw DB ids (NOT the `db-` prefix
 * variant produced by fetchPersistedEvents). The fetch-feeds cron has the
 * raw IDs in scope after persistEvents(), so this is straightforward there.
 */
import { extractEntities } from "@/lib/nlp/entity-extraction";
import { upsertEntity, linkEntitiesToEvent } from "./entities";

export interface EntityPipelineInput {
  id: string;
  title: string;
  summary?: string | null;
}

export interface EntityPipelineResult {
  eventsProcessed: number;
  entitiesUpserted: number;
  linksCreated: number;
  errors: number;
}

export async function runEntityPipeline(
  events: EntityPipelineInput[]
): Promise<EntityPipelineResult> {
  const result: EntityPipelineResult = {
    eventsProcessed: 0,
    entitiesUpserted: 0,
    linksCreated: 0,
    errors: 0,
  };

  for (const event of events) {
    try {
      const text = `${event.title}. ${event.summary || ""}`;
      const extracted = extractEntities(text);
      result.eventsProcessed++;
      if (extracted.length === 0) continue;

      const linked: Array<{ entityId: number; confidence: number }> = [];
      for (const ent of extracted) {
        try {
          const persisted = await upsertEntity(ent);
          linked.push({ entityId: persisted.id, confidence: ent.confidence });
          result.entitiesUpserted++;
        } catch (err) {
          // One bad slug shouldn't fail the whole event; log and continue
          console.error("[entity-pipeline] upsert failed", ent.name, err);
          result.errors++;
        }
      }
      if (linked.length > 0) {
        await linkEntitiesToEvent(event.id, linked);
        result.linksCreated += linked.length;
      }
    } catch (err) {
      console.error("[entity-pipeline] event failed", event.id, err);
      result.errors++;
    }
  }

  return result;
}
