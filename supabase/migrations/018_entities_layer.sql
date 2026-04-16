-- ═══════════════════════════════════════════════════════════════════
--  Migration 018 — Entity Layer (Palantir-style ontology)
-- ═══════════════════════════════════════════════════════════════════
--  Persistent entities + story junction so we can build
--  /entity/[slug] pages, graph views, and historical analytics.
--
--  Why a separate table (vs JSONB on events)?
--    1. Single canonical record per entity across thousands of events
--    2. Aliases live on the entity, not duplicated per mention
--    3. Graph queries via a junction are O(log n), not O(n) full-scan
--    4. SEO: /entity/[slug] needs a stable URL identity
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS entities (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('person','organization','country','topic')),
  aliases TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mention_count INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_last_seen ON entities(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_entities_mention_count ON entities(mention_count DESC);
CREATE INDEX IF NOT EXISTS idx_entities_aliases ON entities USING GIN (aliases);

-- Junction: which entities appear in which events.
-- event_id is TEXT to match convergence_embeddings pattern (events table
-- uses TEXT primary keys throughout the codebase).
CREATE TABLE IF NOT EXISTS story_entities (
  event_id TEXT NOT NULL,
  entity_id BIGINT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  confidence REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_story_entities_entity ON story_entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_story_entities_event ON story_entities(event_id);
CREATE INDEX IF NOT EXISTS idx_story_entities_created ON story_entities(created_at DESC);

-- Atomic upsert RPC — used from app code so we don't race on
-- concurrent inserts of the same slug from parallel cron runs.
CREATE OR REPLACE FUNCTION upsert_entity(
  p_slug TEXT, p_name TEXT, p_type TEXT
) RETURNS entities AS $$
DECLARE
  result entities;
BEGIN
  INSERT INTO entities (slug, name, type)
  VALUES (p_slug, p_name, p_type)
  ON CONFLICT (slug) DO UPDATE
    SET mention_count = entities.mention_count + 1,
        last_seen = NOW(),
        updated_at = NOW()
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Co-occurrence view for the graph view.
-- "Entity A and B appeared in N shared events" — materializing this as a
-- regular view keeps it always-fresh. If query time becomes an issue at
-- scale, convert to a materialized view refreshed nightly.
CREATE OR REPLACE VIEW entity_cooccurrence AS
SELECT
  LEAST(a.entity_id, b.entity_id)    AS entity_a,
  GREATEST(a.entity_id, b.entity_id) AS entity_b,
  COUNT(*)                           AS shared_events,
  MAX(a.created_at)                  AS last_co_occurred
FROM story_entities a
JOIN story_entities b
  ON a.event_id = b.event_id
 AND a.entity_id < b.entity_id
GROUP BY LEAST(a.entity_id, b.entity_id), GREATEST(a.entity_id, b.entity_id);
