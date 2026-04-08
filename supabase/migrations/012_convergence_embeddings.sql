-- ═══════════════════════════════════════════════════════════════════
--  Migration 012 — Convergence Event Embeddings (pgvector)
-- ═══════════════════════════════════════════════════════════════════
--
--  Stores per-event embedding vectors so the convergence engine can
--  reuse them across cycles instead of paying the Gemini API cost
--  every 5 minutes for the same event.
--
--  Benefits of a SEPARATE table (vs adding to events):
--    1. Provider versioning — if we switch from Gemini to Cohere, we
--       can keep both sets and migrate gradually.
--    2. Partial coverage — not every event needs an embedding (only
--       those within correlation clusters).
--    3. Keeps the hot `events` table lean (3KB × N rows adds up).
--    4. Can drop/rebuild the embedding cache without touching events.
--
-- ═══════════════════════════════════════════════════════════════════

-- Enable pgvector if not already (Supabase ships with it pre-installed)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS convergence_embeddings (
  event_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  embedding VECTOR(768) NOT NULL,
  dimensions INTEGER NOT NULL DEFAULT 768,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, provider)
);

-- Fast lookup by event_id (most common: "do we already have this?")
CREATE INDEX IF NOT EXISTS idx_embeddings_event
  ON convergence_embeddings (event_id);

-- HNSW vector index for nearest-neighbor search.
-- Lower m = less memory, higher recall = slower. m=16 is the sweet spot
-- for 768-dim embeddings at our scale.
CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw
  ON convergence_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Auto-purge embeddings for events that no longer exist.
-- We DON'T add a FK constraint to events(id) because events might be
-- partitioned/purged on a different schedule. Instead, rely on this
-- cleanup function called from cron.
CREATE OR REPLACE FUNCTION purge_orphaned_embeddings()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM convergence_embeddings
  WHERE event_id NOT IN (SELECT id FROM events WHERE id IS NOT NULL);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Also purge embeddings older than 60 days (events get recycled via
-- the feed pipeline, so stale embeddings are dead weight)
CREATE OR REPLACE FUNCTION purge_old_embeddings()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM convergence_embeddings
  WHERE created_at < NOW() - INTERVAL '60 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
