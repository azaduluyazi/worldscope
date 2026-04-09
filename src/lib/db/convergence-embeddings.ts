import { createServerClient } from "./supabase";

// ═══════════════════════════════════════════════════════════════════
//  Convergence Embedding Cache (pgvector)
// ═══════════════════════════════════════════════════════════════════
//
//  Persists Gemini (or other provider) embeddings so the engine can
//  reuse them across cycles. Without this, every cron run re-embeds
//  the same event titles and burns API quota.
//
//  Workflow:
//    1. Engine collects events in correlated clusters
//    2. Calls fetchExistingEmbeddings(eventIds) to see which are cached
//    3. Embeds only the missing ones
//    4. Writes new embeddings back via storeEmbeddings()
//
// ═══════════════════════════════════════════════════════════════════

const TABLE = "convergence_embeddings";

export interface StoredEmbedding {
  eventId: string;
  provider: string;
  embedding: number[];
  createdAt: string;
}

/**
 * Fetch cached embeddings for a list of event IDs. Returns a Map for
 * O(1) lookup. Missing IDs are simply absent from the map — the
 * caller embeds those from scratch.
 */
export async function fetchExistingEmbeddings(
  eventIds: string[],
  provider: string = "gemini-embedding-001"
): Promise<Map<string, number[]>> {
  if (eventIds.length === 0) return new Map();
  try {
    const supabase = createServerClient();
    // Supabase has a ~1000 argument limit per `in` clause — chunk if needed
    const CHUNK = 500;
    const result = new Map<string, number[]>();
    for (let i = 0; i < eventIds.length; i += CHUNK) {
      const chunk = eventIds.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from(TABLE)
        .select("event_id, embedding")
        .eq("provider", provider)
        .in("event_id", chunk);
      if (error) {
        console.error("[embeddings.fetchExisting] error:", error);
        continue;
      }
      for (const row of data ?? []) {
        // pgvector returns the embedding as a string like "[0.1,0.2,...]"
        // or as a raw array depending on the client. Handle both.
        let vec: number[];
        if (Array.isArray(row.embedding)) {
          vec = row.embedding;
        } else if (typeof row.embedding === "string") {
          try {
            vec = JSON.parse(row.embedding);
          } catch {
            continue;
          }
        } else {
          continue;
        }
        result.set(row.event_id, vec);
      }
    }
    return result;
  } catch (err) {
    console.error("[embeddings.fetchExisting] exception:", err);
    return new Map();
  }
}

/**
 * Persist new embeddings to the cache. Upserts on (event_id, provider)
 * so re-running is idempotent.
 */
export async function storeEmbeddings(
  entries: Array<{ eventId: string; embedding: number[] }>,
  provider: string = "gemini-embedding-001"
): Promise<number> {
  if (entries.length === 0) return 0;
  try {
    const supabase = createServerClient();
    const rows = entries.map((e) => ({
      event_id: e.eventId,
      provider,
      // pgvector accepts the string form "[1,2,3]" universally
      embedding: `[${e.embedding.join(",")}]`,
      dimensions: e.embedding.length,
    }));
    const { error, count } = await supabase
      .from(TABLE)
      .upsert(rows, { onConflict: "event_id,provider", count: "exact" });
    if (error) {
      console.error("[embeddings.store] error:", error);
      return 0;
    }
    return count ?? rows.length;
  } catch (err) {
    console.error("[embeddings.store] exception:", err);
    return 0;
  }
}

/**
 * Run the pgvector nearest-neighbor query to find events semantically
 * similar to a given vector. Used by storyline matching to bridge
 * cross-geo stories that share meaning.
 */
export async function findSimilarEmbeddings(
  queryEmbedding: number[],
  options: {
    topK?: number;
    minSimilarity?: number;
    provider?: string;
  } = {}
): Promise<Array<{ eventId: string; similarity: number }>> {
  const { topK = 10, minSimilarity = 0.75, provider = "gemini-embedding-001" } = options;
  try {
    const supabase = createServerClient();
    // Cosine distance in pgvector: `<=>` operator. Similarity = 1 - distance.
    // We use a raw query since supabase-js doesn't expose vector ops natively.
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;
    const { data, error } = await supabase.rpc("match_convergence_embeddings", {
      query_embedding: vectorLiteral,
      match_provider: provider,
      match_threshold: 1 - minSimilarity, // convert similarity → distance
      match_count: topK,
    });
    if (error) {
      // RPC may not exist yet in older DBs — silent degrade
      return [];
    }
    return (data ?? []).map((row: { event_id: string; similarity: number }) => ({
      eventId: row.event_id,
      similarity: Number(row.similarity),
    }));
  } catch {
    return [];
  }
}

/**
 * Call the cleanup RPC to remove orphaned embeddings (whose parent
 * events were purged from the events table).
 */
export async function purgeOrphanedEmbeddings(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("purge_orphaned_embeddings");
    if (error) {
      console.error("[embeddings.purge] error:", error);
      return 0;
    }
    return Number(data ?? 0);
  } catch {
    return 0;
  }
}
