-- ═══════════════════════════════════════════════════════════════════
--  Migration 019 — Semantic Search RPC
-- ═══════════════════════════════════════════════════════════════════
--  Reads convergence_embeddings (already populated by the convergence
--  cron, migration 012) and returns cosine-similar events for a query
--  embedding. Powers /api/search/semantic.
--
--  Performance: leverages the existing HNSW index (idx_embeddings_hnsw)
--  from migration 012 — query is O(log n) with high recall at m=16.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION search_events_semantic(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  event_id TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    ce.event_id,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM convergence_embeddings ce
  WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
$$;
