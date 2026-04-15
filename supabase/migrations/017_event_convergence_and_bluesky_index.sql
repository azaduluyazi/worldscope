-- ─────────────────────────────────────────────
-- Migration 017 — Event convergence scores view + Bluesky stateful index
-- Applied on Supabase via MCP 2026-04-15.
-- Idempotent.
-- ─────────────────────────────────────────────

-- 1. GIN index on snapshots for fast JSONB lookup
CREATE INDEX IF NOT EXISTS idx_storylines_snapshots_gin
  ON convergence_storylines USING gin (snapshots);

-- 2. View: event_id → best matching storyline (highest peak_confidence)
CREATE OR REPLACE VIEW event_convergence_scores AS
SELECT DISTINCT ON (sig->>'eventId')
  SUBSTRING(sig->>'eventId' FROM 4) AS event_id,
  s.id AS storyline_id,
  s.headline AS storyline_headline,
  s.peak_confidence,
  s.categories,
  s.affected_regions,
  s.last_activity_at
FROM convergence_storylines s,
LATERAL jsonb_array_elements(s.snapshots) snap,
LATERAL jsonb_array_elements(snap->'signals') sig
WHERE s.archived = false
  AND (sig->>'eventId') LIKE 'db-%'
ORDER BY sig->>'eventId', s.peak_confidence DESC NULLS LAST;

-- 3. Bluesky posts table — replaces live search in getFeedSkeleton
CREATE TABLE IF NOT EXISTS bluesky_posts (
  uri          TEXT PRIMARY KEY,
  cid          TEXT NOT NULL,
  feed_rkey    TEXT NOT NULL,
  author_did   TEXT,
  author_handle TEXT,
  text         TEXT,
  created_at   TIMESTAMPTZ NOT NULL,
  indexed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  langs        TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_bluesky_posts_feed_created
  ON bluesky_posts (feed_rkey, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bluesky_posts_indexed_at
  ON bluesky_posts (indexed_at DESC);

-- 4. Cleanup function — prune posts older than 7 days
CREATE OR REPLACE FUNCTION prune_bluesky_posts()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH d AS (
    DELETE FROM bluesky_posts
    WHERE indexed_at < NOW() - INTERVAL '7 days'
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM d;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS: bluesky_posts is server-write, public-read
ALTER TABLE bluesky_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bluesky_posts_public_read ON bluesky_posts;
CREATE POLICY bluesky_posts_public_read
  ON bluesky_posts FOR SELECT
  USING (TRUE);
